<?php



/**
 * Language support module package
 *
 * @author Author Name <author.name@action-media.ru>
 * @copyright 2019 Colibri
 * @package App\Modules\Lang
 */
namespace App\Modules\Lang;


use Colibri\Modules\Module as BaseModule;
use Colibri\Utils\Cache\Bundle;
use Colibri\Utils\Menu\Item;
use Colibri\IO\FileSystem\File;
use Colibri\App;
use Colibri\Events\EventsContainer;
use Colibri\Utils\Config\ConfigException;
use Colibri\Utils\Config\Config;
use Colibri\Web\Server;
use Panda\Yandex\TranslateSdk;
use Colibri\AppException;
use DateTime;
use Google\Cloud\Translate\V2\TranslateClient;
use Panda\Yandex\TranslateSdk\Limit;
use Throwable;
use Colibri\Utils\Logs\Logger;


/**
 * Language support module
 * @package App\Modules\Lang
 * 
 * @property-read string $claudName
 * @property-read TranslateClient|TranslateSdk\Cloud|null $claud
 * @property-read string $current
 * @property-read string $userselected
 *
 */
class Module extends BaseModule
{

    /**
     * Синглтон
     *
     * @var Module
     */
    public static ? Module $instance = null;

    private static ?string $current = null;

    private ?string $_default = null;

    private array $_texts;

    private $_claudApi;

    /**
     * Initializes the module
     * @return void
     */
    public function InitializeModule(): void
    {
        self::$instance = $this;

        $this->_claudApi = null;

        $this->InitCurrent();
        $this->InitHandlers();



    }

    /**
     * Initializes the api classes
     * @return TranslateClient|TranslateSdk\Cloud
     */
    public function InitApis()
    {
        if ($this->_claudApi) {
            return $this->_claudApi;
        }

        $claudName = $this->claudName;
        if ($claudName == 'yandex-api') {
            if ((bool) $this->Config()->Query('config.yandex-api.enabled')->GetValue()) {
                try {
                    $this->_claudApi = new TranslateSdk\Cloud($this->Config()->Query('config.yandex-api.token')->GetValue(), $this->Config()->Query('config.yandex-api.catalogue')->GetValue());
                } catch (TranslateSdk\Exception\ClientException | \TypeError $e) {

                }
            }
        } elseif ($claudName == 'google-api') {
            if ((bool) $this->Config()->Query('config.google-api.enabled')->GetValue()) {
                try {
                    $this->_claudApi = new TranslateClient([
                        'key' => $this->Config()->Query('config.google-api.token')->GetValue()
                    ]);
                } catch (Throwable $e) {

                }
            }
        }
        return $this->_claudApi;
    }

    /**
     * Magic method, provides a property access
     * @param string $prop
     * @return mixed
     */
    public function __get(string $prop): mixed
    {
        if (strtolower($prop) === 'current') {
            return self::$current;
        } elseif (strtolower($prop) === 'cloud') {
            return $this->_claudApi;
        } elseif (strtolower($prop) === 'claudname') {
            return (string) $this->Config()->Query('config.use', 'yandex-api')->GetValue();
        } elseif (strtolower($prop) === 'userselected') {
            return App::$request->headers->{'Colibri-Language'} ?: App::$request->cookie->{'lang'};
        } else {
            return parent::__get($prop);
        }
    }

    /**
     * Returns default language
     * @return string|null
     */
    public function Default (): ?string
    {
        if ($this->_default) {
            return $this->_default;
        }

        $langs = $this->Langs();
        foreach ($langs as $key => $value) {
            if ($value->default) {
                $this->_default = $key;
                return $this->_default;
            }
        }
        $this->_default = null;
        return null;
    }

    /**
     * Returns a languages list
     * @return object
     */
    public function Langs(): object
    {
        return $this->Config()->Query('config.langs')->AsObject();
    }

    /**
     * Initializes a current language
     * @param string|null $lang
     * @return void
     */
    public function InitCurrent(?string $lang = null)
    {
        if ($lang) {
            self::$current = $lang;
            return;
        }

        $default = '';
        $langs = $this->Langs();
        foreach ($langs as $key => $lang) {
            if ($lang->default) {
                $default = $key;
                break;
            }
        }

        if(App::$request->headers->{'Colibri-Language'}) {
            self::$current = App::$request->headers->{'Colibri-Language'};
        } elseif (App::$request->cookie->{'lang'}) {
            self::$current = App::$request->cookie->{'lang'};
        } else {
            self::$current = $default;
        }

    }

    /**
     * Initializes an event handlers
     * @return void
     */
    public function InitHandlers()
    {
        $instance = self::$instance;
        App::$instance->HandleEvent(EventsContainer::RpcRequestProcessed, function ($event, $args) use ($instance) {
            if ($args->type === Server::Stream) {
                return true;
            }
            if (!isset($args->result->cookies)) {
                $args->result->cookies = [];
            }
            $args->result->cookies = array_merge($args->result->cookies, [$instance?->GenerateCookie() ?? null]);
            $args->result = $instance?->ParseArray($args->result, !$args->post->__raw || $args->post->__raw !== 1) ?? $args->result;
            return true;
        });

        App::$instance->HandleEvent(EventsContainer::BundleFile, function ($event, $args) use ($instance) {
            $file = new File($args->file);
            if (in_array($file->extension, ['html', 'js'])) {
                // компилируем html в javascript
                $args->content = $instance?->ParseString($args->content) ?? $args->content;
            }
            return true;
        });

        App::$instance->HandleEvent(EventsContainer::TemplateRendered, function ($event, $args) use ($instance) {
            $args->content = $instance?->ParseString($args->content) ?? $args->content;
            return true;
        });

    }

    /**
     * Generates a default language cookie
     * @param bool $secure
     * @return object
     */
    public function GenerateCookie(bool $secure = true): object
    {
        // $this->expires
        return (object) ['name' => 'lang', 'value' => $this->current, 'expire' => time() + 365 * 86400, 'domain' => App::$request->host, 'path' => '/', 'secure' => $secure];
    }

    /**
     * Checks an object for language data
     * @param array|object $object
     * @return bool
     */
    private function _checkObject(array|object $object): bool
    {

        $object = (array) $object;
        if (empty($object)) {
            return false;
        }

        $checkFor = [];
        $langs = $this->Langs();
        foreach ($langs as $key => $lang) {
            $checkFor[] = $key;
        }

        foreach ($object as $key => $value) {
            // если есть хоть одно значение, НЕ СТРОКА то это не языковой обьект
            if (!is_string($value)) {
                return false;
            }
            if (!in_array($key, $checkFor)) {
                return false;
            }
        }

        return true;

    }

    /**
     * Parses a string data and returns a language text keys
     * @param string $value
     * @return array
     */
    public function ParseAndGetKeys(string $value): array
    {
        $keys = [];
        $res = preg_match_all('/#\{(.*?)\}/sm', $value, $matches, PREG_SET_ORDER);
        if ($res > 0) {
            foreach ($matches as $match) {
                $parts = explode(';', $match[1]);
                $key = $parts[0];
                $keys[] = $key;
            }
        }
        return $keys;
    }

    /**
     * Parses a string and replaces the language text keys with translated data
     * @param string $value
     * @return string
     */
    public function ParseString(string $value): string
    {
        $res = preg_match_all('/#\{(.*?)\}/sm', $value, $matches, PREG_SET_ORDER);
        if ($res > 0) {
            foreach ($matches as $match) {
                $parts = explode(';', $match[1]);
                $key = $parts[0];
                $default = $parts[1] ?? '';
                $replaceWith = Module::$instance->Get($key, $default);
                $value = str_replace($match[0], str_replace('"', '&quot;', str_replace('\'', '`', $replaceWith)), $value);
            }
        }
        return $value;
    }

    /**
     * Parses an array or object for language text keys and replaces with translated data
     * @param array|object $array
     * @param bool $checkInObjects
     * @return array
     */
    public function ParseArray(array |object $array, bool $checkInObjects = false): array
    {
        $ret = [];
        foreach ($array as $key => $value) {
            if ($value instanceof DateTime) {
                $ret[$key] = $value;
                continue;
            }
            if (is_array($value)) {
                if ($checkInObjects && $this->_checkObject(($value))) {
                    $ret[$key] = $value[$this->current];
                } else {
                    $ret[$key] = $this->ParseArray($value, $checkInObjects);
                }
            } elseif (is_object($value)) {
                if (method_exists($value, 'ToArray')) {
                    $value = $value->ToArray();
                }
                $value = (array) $value;
                if ($checkInObjects && $this->_checkObject($value)) {
                    $ret[$key] = $value[$this->current] ?? $value;
                } else {
                    $ret[$key] = $this->ParseArray($value, $checkInObjects);
                }

            } else {
                if (is_string($value)) {
                    $value = $this->ParseString($value);
                }
                $ret[$key] = $value;
            }
        }
        return $ret;
    }

    /**
     * Loads and returns a texts for all project
     * @param mixed $reload
     * @return array
     */
    public function LoadTexts($reload = false)
    {

        if (!empty($this->_texts)) {
            return $this->_texts;
        }

        $this->_texts = [];

        $uiPath = App::$appRoot . 'vendor/colibri/ui/src/';
        $langFiles = array_merge(
            Bundle::GetNamespaceAssets($uiPath, ['lang']),
            Bundle::GetChildAssets(
                $uiPath,
                ['lang']
            )
        );
        foreach ($langFiles as $langFile) {
            $config = Config::LoadFile($langFile);
            $readonlyTexts = $config->AsArray();
            foreach ($readonlyTexts as $key => $value) {
                $readonlyTexts[$key]['file'] = base64_encode('/' . str_replace(App::$appRoot, '', $langFile));
            }
            $this->_texts = array_merge($this->_texts, $readonlyTexts);
        }

        $modules = App::$moduleManager->list;
        foreach ($modules as $module) {
            try {
                $langConfigObject = $module->Config()->Query('config.texts');
                $langConfig = $langConfigObject->AsArray();
                $langConfig = array_map(function ($langText) use ($langConfigObject) {
                    $langText['file'] = base64_encode('/config/' . $langConfigObject->GetFile());
                    return $langText;
                }, $langConfig);
                $this->_texts = array_merge($this->_texts, $langConfig);

                $langFiles = array_merge(
                    Bundle::GetNamespaceAssets($module->modulePath, ['lang']),
                    Bundle::GetChildAssets($module->modulePath, ['lang'])
                );

                $pathsArray = $module->Config()->Query('config.paths.ui', [])->ToArray();
                foreach($pathsArray as $path) {
                    if(is_object($path)) {
                        $path = $path->path;
                    } else if(is_array($path)) {
                        $path = $path['path'];
                    }
                    $langFiles = [
                        ...$langFiles, 
                        ...Bundle::GetNamespaceAssets(App::$appRoot . $path, ['lang']),
                        ...Bundle::GetChildAssets(App::$appRoot . $path, ['lang'])
                    ];
                }

                foreach ($langFiles as $langFile) {
                    $config = Config::LoadFile($langFile);
                    $readonlyTexts = $config->AsArray();
                    foreach ($readonlyTexts as $key => $value) {
                        $readonlyTexts[$key]['file'] = base64_encode('/' . str_replace(App::$appRoot, '', $langFile));
                    }
                    $this->_texts = array_merge($this->_texts, $readonlyTexts);
                }

            } catch (ConfigException $e) {
            }
        }

        return $this->_texts;
    }

    /**
     * Returns a translated text for key or default
     * @param mixed $text
     * @param mixed $default
     * @return string|null
     */
    public function Get($text, $default): ?string
    {
        $langs = $this->LoadTexts();
        if (isset($langs[$text])) {
            return $langs[$text][self::$current] ?? $default;
        }

        $split = explode('-', $text);
        $module = reset($split);
        if ($module == 'app') {
            $moduleObject = $this;
        } else {
            $moduleObject = App::$moduleManager->$module;
        }
        if (!$moduleObject) {
            return $default;
        }

        // $moduleConfig = $moduleObject->Config();
        // $langConfig = $moduleConfig->Query('config.texts', []);
        // $langConfig->Set($text, [self::$current => $default]);
        // $langConfig->Save();

        $this->_texts = array_merge($this->_texts, [$text => [self::$current => $default]]);

        return $default;
    }

    /**
     * Returns language text with translations as object
     * @param mixed $text
     * @return object|array|null
     */
    public function GetAsObject($text): object|array |null
    {

        $langs = $this->LoadTexts();
        if (!isset($langs[$text])) {
            return null;
        }

        return $langs[$text];

    }

    public function Translate(mixed $langText, string $lang = null): ?string 
    {
        if(is_string($langText)) {
            return $langText;
        }
        if(is_array($langText) || is_object($langText)) {
            $langText = (array)$langText;
            return $langText[$lang ?: self::$current];
        }
        return null;
    }

    /**
     * Saves key and data for translation
     * @param mixed $key
     * @param mixed $data
     * @return object|array|string|null
     */
    public function Save($key, $data): object|array |string|null
    {
        $file = null;
        if ($data['file']) {
            $file = base64_decode($data['file']);
            unset($data['file']);
        }

        if (!$file) {
            return null;
        }

        $langConfig = Config::LoadFile(App::$appRoot . $file);
        $langConfig->Set($key, $data);
        $langConfig->Save();

        $this->LoadTexts(true);

        return (object) $data;

    }

    /**
     * Deletes a translations
     * @param string|array $keys
     * @return bool
     */
    public function Delete(string|array $keys): bool
    {
        if (is_string($keys)) {
            $keys = [$keys];
        }

        foreach ($keys as $key) {

            $split = explode('-', $key);
            $module = reset($split);
            if ($module == 'app') {
                $moduleObject = $this;
            } else {
                $moduleObject = App::$moduleManager->$module;
            }
            if (!$moduleObject) {
                $moduleObject = $this;
            }

            $moduleConfig = $moduleObject->Config();
            $langConfig = $moduleConfig->Query('config.texts');
            $langConfig->Set($key, null);
            $langConfig->Save();
        }

        $this->LoadTexts(true);

        return true;
    }

    /**
     * Returns a topmost menu for backend
     */
    public function GetTopmostMenu(bool $hideExecuteCommand = true): Item|array
    {
        return [
            Item::Create('more', '#{mainframe-menu-more}', '', 'App.Modules.MainFrame.Icons.MoreIcon', '')->Add([
                Item::Create('lang', '#{lang-menu-settings}', '#{lang-menu-settings-desc}', 'App.Modules.Lang.Icons.LangSettingsIcon', 'App.Modules.Lang.SettingsPage'),
            ])
        ];

    }

    /**
     * Returns a permissions for module
     * @return array
     */
    public function GetPermissions(): array
    {
        $permissions = parent::GetPermissions();
        $permissions['lang'] = '#{lang-permissions}';
        return $permissions;
    }

    /**
     * Translates a chunk using integrated cloud translate api
     * @param string $originalLang
     * @param string $translateLang
     * @param string|array $text
     * @return array|string
     */
    private function _translateChunk(string $originalLang, string $translateLang, string|array $text): array |string
    {

        $translate = new TranslateSdk\Translate('', $translateLang);
        $translate->setSourceLang($originalLang);
        $translate->setFormat(TranslateSdk\Format::HTML);

        if(is_array($text)) {
            foreach ($text as $t) {
                $translate->addText($t);
            }
        }
        else {
            $translate->addText($text);
        }

        $result = $this->_claudApi->request($translate);
        $result = json_decode($result);
        if ($result && count($result?->translations ?? []) > 0) {
            $res = [];
            foreach ($result?->translations as $trans) {
                if ($trans?->text ?? false) {
                    $res[] = $trans?->text;
                }
            }
            return count($res) > 1 ? $res : reset($res);
        }

        return [];

    }

    /**
     * Translates data using integrated cloud api
     * @param string $originalLang
     * @param string $translateLang
     * @param string|array $text
     * @throws AppException
     * @return string|array|null
     */
    public function CloudTranslate(string $originalLang, string $translateLang, string|array $text): string|array |null
    {

        if ($this->_claudApi) {


            if ($this->claudName === 'yandex-api') {
                try {

                    if (is_array($text)) {
                        $result = [];
                        $chunk = [];
                        $textLength = 0;
                        foreach ($text as $t) {
                            $textLength += mb_strlen($t);
                            if ($textLength > Limit::TRANSLATE_TEXTS_LENGTH - 1000) {
                                $r = $this->_translateChunk($originalLang, $translateLang, $chunk);
                                if (is_string($r)) {
                                    $r = [$r];
                                }
                                $result = array_merge($result, $r);
                                $chunk = [];
                                $textLength = 0;
                            }
                            $chunk[] = $t;
                        }

                        if (!empty($chunk)) {
                            $r = $this->_translateChunk($originalLang, $translateLang, $chunk);
                            if (is_string($r)) {
                                $r = [$r];
                            }
                            $result = array_merge($result, $r);
                        }

                    } else {
                        $result = $this->_translateChunk($originalLang, $translateLang, $text);
                    }
                    return $result;
                } catch (TranslateSdk\Exception\ClientException $e) {
                    throw new AppException($e->getMessage(), $e->getCode(), $e);
                }
            } elseif ($this->claudName === 'google-api') {
                $result = $this->_claudApi->translate($text, [
                    'source' => $originalLang,
                    'target' => $translateLang
                ]);
                if ($result && ($result['text'] ?? null)) {
                    return $result['text'];
                }
            }


        }

        return null;

    }

    /**
     * Backups module data
     * @param Logger $logger
     * @param string $path
     * @return void
     */
    public function Backup(Logger $logger, string $path)
    {
        // Do nothing        

    }

}
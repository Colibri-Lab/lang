<?php



/**
 * Search
 *
 * @author Author Name <author.name@action-media.ru>
 * @copyright 2019 Colibri
 * @package App\Modules\Lang
 */
namespace App\Modules\Lang;


use Colibri\Modules\Module as BaseModule;
use Colibri\Utils\Cache\Bundle;
use Colibri\Utils\Debug;
use Colibri\Utils\Menu\Item;
use Colibri\IO\FileSystem\File;
use Colibri\App;
use Colibri\Events\EventsContainer;
use Colibri\Utils\Config\ConfigException;
use Colibri\Utils\Config\Config;
use Panda\Yandex\TranslateSdk;
use Colibri\AppException;
use Colibri\Utils\Cache\Mem;
use DateTime;
use Google\Cloud\Translate\V2\TranslateClient;
use Throwable;
use Colibri\Utils\Logs\Logger;


/**
 * Описание модуля
 * @package App\Modules\Lang
 *
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
     * Инициализация модуля
     * @return void
     */
    public function InitializeModule(): void
    {
        self::$instance = $this;

        $this->_claudApi = null;

        $this->InitCurrent();
        $this->InitHandlers();

        

    }

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
        } else if ($claudName == 'google-api') {
            if ((bool) $this->Config()->Query('config.google-api.enabled')->GetValue()) {
                try {
                    $this->_claudApi = new TranslateClient([
                        'key' => $this->Config()->Query('config.google-api.token')->GetValue()
                    ]);
                } catch (Throwable $e) {

                }
            }
        }

    }

    public function __get(string $prop): mixed
    {
        if (strtolower($prop) === 'current') {
            return self::$current;
        } else if (strtolower($prop) === 'cloud') {
            return $this->_claudApi;
        } else if (strtolower($prop) === 'claudname') {
            return (string) $this->Config()->Query('config.use', 'yandex-api')->GetValue();
        } else {
            return parent::__get($prop);
        }
    }

    public function Default(): ?string
    {
        if($this->_default) {
            return $this->_default;
        }

        $langs = $this->Langs();
        foreach($langs as $key => $value) {
            if($value->default) {
                $this->_default = $key;
                return $this->_default;
            }
        }
        $this->_default = null;
        return null;
    }

    public function Langs(): object
    {
        return $this->Config()->Query('config.langs')->AsObject();
    }

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

        self::$current = App::$request->headers->{'Colibri-Language'} ?: App::$request->cookie->lang ?: $default;

    }

    public function InitHandlers()
    {
        $instance = self::$instance;
        App::$instance->HandleEvent(EventsContainer::RpcRequestProcessed, function ($event, $args) use ($instance) {
            if(!isset($args->result->cookies)) {
                $args->result->cookies = [];
            }
            $args->result->cookies = array_merge($args->result->cookies, [$instance->GenerateCookie()]);
            $args->result = $instance->ParseArray($args->result, !$args->post->__raw || $args->post->__raw !== 1);
        });

        App::$instance->HandleEvent(EventsContainer::BundleFile, function ($event, $args) use ($instance) {
            $file = new File($args->file);
            if (in_array($file->extension, ['html', 'js'])) {
                // компилируем html в javascript
                $args->content = $instance->ParseString($args->content);
            }
            return true;
        });

        App::$instance->HandleEvent(EventsContainer::TemplateRendered, function ($event, $args) use ($instance) {
            $args->content = $instance->ParseString($args->content);
            return true;
        });

    }

    public function GenerateCookie(bool $secure = true): object
    {
        // $this->expires
        return (object) ['name' => 'lang', 'value' => $this->current, 'expire' => time() + 365 * 86400, 'domain' => App::$request->host, 'path' => '/', 'secure' => $secure];
    }

    private function _checkObject(array|object $object): bool 
    {

        $object = (array) $object;
        if(empty($object)) {
            return false;
        }

        $checkFor = [];
        $langs = $this->Langs();
        foreach ($langs as $key => $lang) {
            $checkFor[] = $key;
        }

        foreach($object as $key => $value) {
            // если есть хоть одно значение, НЕ СТРОКА то это не языковой обьект
            if(!is_string($value)) {
                return false;
            }
            if(!in_array($key, $checkFor)) {
                return false;
            }
        }

        return true;

    }

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

    public function ParseArray(array |object $array, bool $checkInObjects = false): array
    {
        $ret = [];
        foreach ($array as $key => $value) {
            if ($value instanceof DateTime) {
                $ret[$key] = $value;
                continue;
            }
            if (is_array($value)) {
                if($checkInObjects && $this->_checkObject(($value))) {
                    $ret[$key] = $value[$this->current];
                }
                else {
                    $ret[$key] = $this->ParseArray($value, $checkInObjects);
                }
            } else if (is_object($value)) {
                if (method_exists($value, 'ToArray')) {
                    $value = $value->ToArray();
                }
                $value = (array) $value;
                if ($checkInObjects && $this->_checkObject($value)) {
                    $ret[$key] = $value[$this->current];
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

    public function LoadTexts($reload = false)
    {

        if (!empty($this->_texts)) {
            return $this->_texts;
        }

        $this->_texts = [];
        $modules = App::$moduleManager->list;
        foreach ($modules as $module) {
            try {
                $langConfig = $module->Config()->Query('config.texts')->AsArray();
                $this->_texts = array_merge($this->_texts, $langConfig);

                $langFiles = array_merge(Bundle::GetNamespaceAssets($module->modulePath, ['lang']), Bundle::GetChildAssets($module->modulePath, ['lang']));
                foreach($langFiles as $langFile) {
                    $config = Config::LoadFile($langFile);
                    $readonlyTexts = $config->AsArray();
                    foreach($readonlyTexts as $key => $value) {
                        $readonlyTexts[$key]['readonly'] = true;
                    }
                    $this->_texts = array_merge($this->_texts, $readonlyTexts);
                }

            } catch (ConfigException $e) {
            }
        }

        return $this->_texts;
    }

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

        $moduleConfig = $moduleObject->Config();
        $langConfig = $moduleConfig->Query('config.texts', []);
        $langConfig->Set($text, [self::$current => $default]);
        $langConfig->Save();

        $this->_texts = array_merge($this->_texts, [$text => [self::$current => $default]]);

        return $default;
    }

    public function GetAsObject($text): object|array|null
    {

        $langs = $this->LoadTexts();
        if (!isset($langs[$text])) {
            return null;
        }

        return $langs[$text];

    }

    public function Save($key, $data): object|array |string|null
    {

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
        $langConfig->Set($key, $data);
        $langConfig->Save();

        $this->LoadTexts(true);

        return $moduleConfig->Query('config.texts.' . $key)->AsObject();

    }

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
     * Вызывается для получения Меню болванкой
     */
    public function GetTopmostMenu(bool $hideExecuteCommand = true): Item|array
    {
        return [
            Item::Create('more', '#{mainframe-menu-more;Инструменты}', '', 'App.Modules.MainFrame.Icons.MoreIcon', '')->Add([
                Item::Create('lang', '#{lang-menu-settings;Настройки языков}', '#{lang-menu-settings-desc;Настройки языков, интерфейсные тексты}', 'App.Modules.Lang.Icons.LangSettingsIcon', 'App.Modules.Lang.SettingsPage'),
            ])
        ];

    }

    public function GetPermissions(): array
    {
        $permissions = parent::GetPermissions();
        $permissions['lang'] = 'Доступ к модулю Lang';
        return $permissions;
    }

    public function CloudTranslate(string $originalLang, string $translateLang, string|array $text): string|array |null
    {

        if ($this->_claudApi) {
            try {

                if ($this->claudName === 'yandex-api') {

                    $translate = new TranslateSdk\Translate('', $translateLang);
                    $translate->setSourceLang($originalLang);
                    $translate->setFormat(TranslateSdk\Format::HTML);
                    if (is_array($text)) {
                        foreach ($text as $t) {
                            $translate->addText($t);
                        }
                    } else {
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
                        return count($res) == 1 ? reset($res) : $res;
                    }
                } else if ($this->claudName === 'google-api') {
                    $result = $this->_claudApi->translate($text, [
                        'source' => $originalLang,
                        'target' => $translateLang
                    ]);
                    if ($result && ($result['text'] ?? null)) {
                        return $result['text'];
                    }
                }

            } catch (TranslateSdk\Exception\ClientException $e) {
                throw new AppException($e->getMessage(), $e->getCode(), $e);
            }
        }

        return null;

    }


    public function Backup(Logger $logger, string $path)
    {
        // Do nothing        

    }

}

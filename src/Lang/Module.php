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
use Colibri\Utils\Menu\Item;
use Colibri\IO\FileSystem\Finder;
use Colibri\IO\FileSystem\File;
use Colibri\Utils\Debug;
use Colibri\App;
use Colibri\Events\EventsContainer;
use Colibri\Utils\Config\ConfigException;
use Panda\Yandex\TranslateSdk;
use Colibri\AppException;


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
    public static ?Module $instance = null;

    private static ?string $current = null;

    /**
     * Инициализация модуля
     * @return void
     */
    public function InitializeModule(): void
    {
        self::$instance = $this;

        $this->InitApis();
        $this->InitCurrent();
        $this->InitHandlers();

    }

    public function InitApis() {
        $this->_claudApi = null;
        if($this->Config()->Query('config.yandex-api.enabled')->GetValue()) {
            try {
                $this->_claudApi = new TranslateSdk\Cloud($this->Config()->Query('config.yandex-api.token')->GetValue(), $this->Config()->Query('config.yandex-api.catalogue')->GetValue());
            } catch (TranslateSdk\Exception\ClientException | \TypeError $e) {
                
            }
        }
    }

    public function __get(string $prop): mixed
    {
        if(strtolower($prop) === 'current') {
            return self::$current;
        }
        if(strtolower($prop) === 'cloud') {
            return $this->_claudApi;
        }
        else {
            return parent::__get($prop);
        }
    }

    public function InitCurrent() {

        $default = '';
        $langs = $this->Config()->Query('config.langs')->AsObject();
        foreach($langs as $key => $lang) {
            if($lang->default) {
                $default = $key;
                break;
            }
        }

        self::$current = App::$request->cookie->lang ?: App::$request->cookie->lang ?: $default;

    }

    public function InitHandlers() {

        App::$instance->HandleEvent(EventsContainer::BundleFile, function ($event, $args) {
            $file = new File($args->file);
            if (in_array($file->extension, ['html', 'js'])) {
                // компилируем html в javascript
                $res = preg_match_all('/#\{(.*?)\}/i', $args->content, $matches, PREG_SET_ORDER);
                if($res > 0) {
                    foreach($matches as $match) {
                        $parts = explode(';', $match[1]);
                        $lang = $parts[0];
                        $default = $parts[1] ?? '';
                        $replaceWith = Module::$instance->Get($lang, $default);
                        $args->content = str_replace($match[0], $replaceWith, $args->content);
                    }
                }
            }
            return true;
        });
    }

    public function Get($text, $default) {
        try {

            $text = $this->Config()->Query('config.texts.'.$text);
            $value = $text->Query(self::$current, $default)->GetValue();
        }
        catch(ConfigException $e) {
            $langConfig = Module::$instance->Config()->Query('config.texts');
            $langConfig->Set($text, [self::$current => $default]);
            $langConfig->Save();
            $value = $default;
        }
        return $value;
    }

    /**
     * Вызывается для получения Меню болванкой
     */
    public function GetTopmostMenu(bool $hideExecuteCommand = true): Item|array
    {
        return [
            Item::Create('more', 'Инструменты', '', 'App.Modules.MainFrame.Icons.MoreIcon', '')->Add([
                Item::Create('lang', 'Настройки языков', 'Настройки языков, интерфейсные тексты', 'App.Modules.Lang.Icons.LangSettingsIcon', 'App.Modules.Lang.SettingsPage'),
            ])
        ];

    }

    public function GetPermissions(): array
    {
        $permissions = parent::GetPermissions();
        $permissions['lang'] = 'Доступ к модулю Lang';
        return $permissions;
    }

    public function CloudTranslate(string $originalLang, string $translateLang, string $text): ?string {

        if($this->_claudApi) {
            try {
                $translate = new TranslateSdk\Translate($text, $translateLang);
                $translate->setSourceLang($originalLang);
                $translate->setFormat(TranslateSdk\Format::PLAIN_TEXT);
                $result = $this->_claudApi->request($translate);
                $result = json_decode($result);
                if($result && $result?->translations[0]?->text) {
                    return $result?->translations[0]?->text;
                }
            } catch (TranslateSdk\Exception\ClientException $e) {
                throw new AppException($e->getMessage(), $e->getCode(), $e);
            }
        }

        return null;

    }




}
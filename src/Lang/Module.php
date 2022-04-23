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

    /**
     * Инициализация модуля
     * @return void
     */
    public function InitializeModule(): void
    {
        self::$instance = $this;

    }

    /**
     * Вызывается для получения Меню болванкой
     */
    public function GetTopmostMenu(bool $hideExecuteCommand = true): Item|array
    {
        return [
            Item::Create('struct', 'Структура', '', 'App.Modules.MainFrame.Icons.StructureIcon', '')->Add([
                Item::Create('lang-catalogue', 'Каталог', 'Список категорий, торговые марки', 'App.Modules.Lang.Icons.CatalogueIcon', 'App.Modules.Lang.CataloguePage'),
                Item::Create('lang-products', 'Товары/Предложения', 'Предложения магазинов', 'App.Modules.Lang.Icons.ProductsIcon', 'App.Modules.Lang.ProductsPage'),
            ]),
            Item::Create('more', 'Инструменты', '', 'App.Modules.MainFrame.Icons.MoreIcon', '')->Add([
                Item::Create('lang', 'Настройки магаина', 'Настройки системы оплаты', 'App.Modules.Lang.Icons.LangSettingsIcon', 'App.Modules.Lang.SettingsPage'),
            ])
        ];

    }

    public function GetPermissions(): array
    {
        $permissions = parent::GetPermissions();
        $permissions['lang'] = 'Доступ к модулю Lang';
        return $permissions;
    }



}
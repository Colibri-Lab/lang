<?php


namespace App\Modules\Lang;

/**
 * @suppress PHP0419
 */
class Installer
{
    private static function _loadConfig($file): ?array
    {
        return yaml_parse_file($file);
    }

    private static function _saveConfig($file, $config): void
    {
        yaml_emit_file($file, $config, \YAML_UTF8_ENCODING, \YAML_ANY_BREAK);
    }

    private static function _getMode($file): string
    {
        $appConfig = self::_loadConfig($file);
        return $appConfig['mode'];
    }

    private static function _injectIntoModuleConfig($file): void
    {

        $modules = self::_loadConfig($file);
        if (is_array($modules['entries'])) {
            foreach ($modules['entries'] as $entry) {
                if ($entry['name'] === 'Lang') {
                    return;
                }
            }
        } else {
            $modules['entries'] = [];
        }

        // надо найти manage или если не нашли то встаем первым

        $manageIndex = 0;
        foreach ($modules['entries'] as $index => $moduleEntry) {
            if ($moduleEntry['name'] === 'Manage') {
                $manageIndex = $index;
                break;
            }
        }

        array_splice($modules['entries'], $manageIndex, 0, [
            [
                'name' => 'Lang',
                'entry' => '\Lang\Module',
                'desc' => 'Языковая поддержка',
                'enabled' => true,
                'visible' => false,
                'for' => [],
                'config' => 'include(/config/lang.yaml)'
            ]
        ]);

        self::_saveConfig($file, $modules);

    }
    private static function _copyOrSymlink($mode, $pathFrom, $pathTo, $fileFrom, $fileTo): void
    {
        print_r('Копируем ' . $mode . ' ' . $pathFrom . ' ' . $pathTo . ' ' . $fileFrom . ' ' . $fileTo . "\n");
        if (!file_exists($pathFrom . $fileFrom)) {
            print_r('Файл ' . $pathFrom . $fileFrom . ' не существует' . "\n");
            return;
        }

        if (file_exists($pathTo . $fileTo)) {
            print_r('Файл ' . $pathTo . $fileTo . ' существует' . "\n");
            return;
        }

        if ($mode === 'local') {
            shell_exec('ln -s ' . realpath($pathFrom . $fileFrom) . ' ' . $pathTo . ($fileTo != $fileFrom ? $fileTo : ''));
        } else {
            shell_exec('cp -R ' . realpath($pathFrom . $fileFrom) . ' ' . $pathTo . $fileTo);
        }

        // если это исполняемый скрипт
        if (strstr($pathTo . $fileTo, '/bin/') !== false) {
            chmod($pathTo . $fileTo, 0777);
        }
    }

    /**
     *
     * @param \Composer\Installer\PackageEvent $event
     * @return void
     */
    public static function PostPackageInstall($event)
    {

        print_r('Установка и настройка модуля Tunnel Lang' . "\n");

        $vendorDir = $event->getComposer()->getConfig()->get('vendor-dir') . '/';
        $operation = $event->getOperation();
        $installedPackage = $operation->getPackage();
        $targetDir = $installedPackage->getName();
        $path = $vendorDir . $targetDir;
        $configPath = $path . '/src/Lang/config-template/';
        $configDir = './config/';

        if (!file_exists($configDir . 'app.yaml')) {
            print_r('Не найден файл конфигурации app.yaml' . "\n");
            return;
        }

        // берем точку входа
        $webRoot = \getenv('COLIBRI_WEBROOT');
        if (!$webRoot) {
            $webRoot = 'web';
        }
        $mode = self::_getMode($configDir . 'app.yaml');

        // копируем конфиг
        print_r('Копируем файлы конфигурации' . "\n");
        self::_copyOrSymlink($mode, $configPath, $configDir, 'module-' . $mode . '.yaml', 'lang.yaml');
        self::_copyOrSymlink($mode, $configPath, $configDir, 'lang-texts.yaml', 'lang-texts.yaml');
        self::_copyOrSymlink($mode, $configPath, $configDir, 'lang-langs.yaml', 'lang-langs.yaml');

        print_r('Встраиваем модуль' . "\n");
        self::_injectIntoModuleConfig($configDir . 'modules.yaml');

        print_r('Копирование изображений' . "\n");
        self::_copyOrSymlink($mode, $path . '/src/Lang/web/res/img/', './' . $webRoot . '/res/img/', 'loading-icon.svg', 'loading-icon.svg');
        self::_copyOrSymlink($mode, $path . '/src/Lang/web/res/fonts/', './' . $webRoot . '/res/fonts/', 'Mardoto/', 'Mardoto/');

        print_r('Установка завершена' . "\n");

        // $mode = $event->getIO()->ask('Установить Yandex.Claud CLI? (y/n)', 'n');
        // if($mode && strtolower($mode) === 'y') {
        //     print_r('Установка Yandex Claud (CLI)'."\n");
        //     shell_exec('curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash');
        // }



    }
}
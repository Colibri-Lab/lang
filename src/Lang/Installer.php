<?php
 
 
namespace App\Modules\Lang;
 
class Installer
{

    private static function _copyOrSymlink($mode, $pathFrom, $pathTo, $fileFrom, $fileTo): void 
    {
        print_r('Копируем '.$mode.' '.$pathFrom.' '.$pathTo.' '.$fileFrom.' '.$fileTo."\n");
        if(!file_exists($pathFrom.$fileFrom)) {
            print_r('Файл '.$pathFrom.$fileFrom.' не существует'."\n");
            return;
        }

        if(file_exists($pathTo.$fileTo)) {
            print_r('Файл '.$pathTo.$fileTo.' существует'."\n");
            return;
        }

        if($mode === 'local') {
            shell_exec('ln -s '.realpath($pathFrom.$fileFrom).' '.$pathTo.($fileTo != $fileFrom ? $fileTo : ''));
        }
        else {
            shell_exec('cp -R '.realpath($pathFrom.$fileFrom).' '.$pathTo.$fileTo);
        }

        // если это исполняемый скрипт
        if(strstr($pathTo.$fileTo, '/bin/') !== false) {
            chmod($pathTo.$fileTo, 0777);
        }
    }
 
    /**
     *
     * @param PackageEvent $event
     * @return void
     */
    public static function PostPackageInstall($event)
    {
 
        print_r('Установка и настройка модуля Tunnel Lang'."\n");
 
        $vendorDir = $event->getComposer()->getConfig()->get('vendor-dir').'/';
        $configDir = './config/';
 
        if(!file_exists($configDir.'app.yaml')) {
            print_r('Не найден файл конфигурации app.yaml'."\n");
            return;
        }
 
        $mode = 'dev';
        $appYamlContent = file_get_contents($configDir.'app.yaml');
        if(preg_match('/mode: (\w+)/', $appYamlContent, $matches) >=0 ) {
            $mode = $matches[1];
        }
 
        $operation = $event->getOperation();
        $installedPackage = $operation->getPackage();
        $targetDir = $installedPackage->getName();
        $path = $vendorDir.$targetDir;
        $configPath = $path.'/src/Lang/config-template/';
 
        // копируем конфиг
        print_r('Копируем файл конфигурации'."\n");
        if(file_exists($configDir.'lang.yaml')) {
            print_r('Файл конфигурации найден, пропускаем настройку'."\n");
            return;
        }
        self::_copyOrSymlink($mode, $configPath, $configDir, 'module-'.$mode.'.yaml', 'lang.yaml');

        if(file_exists($configDir.'lang-texts.yaml')) {
            print_r('Файл конфигурации найден, пропускаем настройку'."\n");
            return;
        }
        self::_copyOrSymlink($mode, $configPath, $configDir, 'lang-texts.yaml', 'lang-texts.yaml');

        if(file_exists($configDir.'lang-langs.yaml')) {
            print_r('Файл конфигурации найден, пропускаем настройку'."\n");
            return;
        }
        self::_copyOrSymlink($mode, $configPath, $configDir, 'lang-langs.yaml', 'lang-langs.yaml');

        // нужно прописать в модули
        $modulesTargetPath = $configDir.'modules.yaml';
        $modulesConfigContent = file_get_contents($modulesTargetPath);
        if(strstr($modulesConfigContent, '- name: Lang') !== false) {
            print_r('Модуль сконфигурирован, пропускаем'."\n");
            return;
        }
 
        $modulesConfigContent = $modulesConfigContent.'
  - name: Lang
    entry: \Lang\Module
    enabled: true
    config: include(/config/lang.yaml)';
        file_put_contents($modulesTargetPath, $modulesConfigContent);
 
        print_r('Установка скриптов'."\n");
        $scriptsPath = $path.'/src/Lang/bin/';
        $binDir = './bin/';
 
        self::_copyOrSymlink($mode, $scriptsPath, $binDir, 'lang-migrate.sh', 'lang-migrate.sh');
        self::_copyOrSymlink($mode, $scriptsPath, $binDir, 'lang-models-generate.sh', 'lang-models-generate.sh');
        print_r('Копирование изображений'."\n");

        $sourcePath = $path.'/src/Lang/web/res/img/';
        $targetDir = './web/res/img/';
        self::_copyOrSymlink($mode, $sourcePath, $targetDir, 'loading-icon.svg', 'loading-icon.svg');

        print_r('Установка завершена'."\n");

        $mode = $event->getIO()->ask('Установить Yandex.Claud CLI? (y/n)', 'n');
        if($mode && strtolower($mode) === 'y') {
            print_r('Установка Yandex Claud (CLI)'."\n");
            shell_exec('curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash');
        }
        

 
    }
}
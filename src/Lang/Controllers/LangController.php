<?php



namespace App\Modules\Lang\Controllers;



use Colibri\App;
use Colibri\Events\EventsContainer;
use Colibri\IO\FileSystem\File;
use Colibri\Utils\Cache\Bundle;
use Colibri\Utils\Debug;
use Colibri\Utils\ExtendedObject;
use Colibri\Web\RequestCollection;
use Colibri\Web\Controller as WebController;
use Colibri\Web\Templates\PhpTemplate;
use Colibri\Web\View;
use ScssPhp\ScssPhp\Compiler;
use ScssPhp\ScssPhp\OutputStyle;
use Colibri\Web\PayloadCopy;
use App\Modules\Lang\Module;
use App\Modules\Security\Module as SecurityModule;
use Colibri\Collections\Collection;




class LangController extends WebController
{

    /**
     * Экшен по умолчанию
     * @param RequestCollection $get данные GET
     * @param RequestCollection $post данные POST
     * @param mixed $payload данные payload обьекта переданного через POST/PUT
     * @return object
     */
    public function Settings(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        return $this->Finish(200, 'ok', ['cloud' => !!Module::$instance->cloudEnabled]);

    }

    public function Langs(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $config = Module::$instance->Config();
        $langs = $config->Query('config.langs')->AsObject();
        return $this->Finish(200, 'ok', $langs);

    }

    public function Texts(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $langs = Module::$instance->Config()->Query('config.langs')->AsObject();
        $texts = Module::$instance->LoadTexts();

        $term = $post->term ?: '';
        $notfilled = $post->notfilled ?: false;
        $page = $post->page ?: 1;
        $pagesize = $post->pagesize ?: 50;

        $collection = new Collection($texts);
        if($term) {
            $collection = $collection->Filter(function($key, $value) use ($term) {
                if(strstr($key, $term) !== false) {
                    return true;
                }
                else {
                    foreach($value as $lang => $v) {
                        if(strstr($v, $term) !== false) {
                            return true;
                        }
                    }
                }
            });
        }

        if($notfilled) {

            $collection = $collection->Filter(function($key, $value) use ($langs) {
                $keys = [];
                foreach($value as $lang => $v) {
                    if($v) {
                        $keys[] = $lang;
                    }
                }

                $ks = array_keys((array)$langs);
                $intersect = array_intersect($keys, $ks);
                if(count($intersect) != count($ks)) {
                    return true;
                }
            });            
        }

        if($page) {
            $collection = $collection->Extract($page, $pagesize);
        }

        return $this->Finish(200, 'ok', $collection->ToArray());

    }

    public function SaveLang(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $lang = $post->lang;
        if(!$lang) {
            return $this->Finish(400, 'Bad request');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('lang.langs.' . (!!$lang ? '.edit' : '.add'))) {
            return $this->Finish(403, 'Permission denied');
        }

        $langKey = $lang['key'];
        unset($lang['key']);

        $langConfig = Module::$instance->Config()->Query('config.langs');
        $langConfig->Set($langKey, $lang);
        $langConfig->Save();

        Module::$instance->LoadTexts(true);

        $newLang = Module::$instance->Config()->Query('config.langs.' . $langKey)->AsObject();

        return $this->Finish(200, 'ok', $newLang);

    }

    public function DeleteLang(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $lang = $post->lang;
        if(!$lang) {
            return $this->Finish(400, 'Bad request');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('lang.langs.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $langConfig = Module::$instance->Config()->Query('config.langs');
        $langConfig->Set($lang, null);
        $langConfig->Save();

        Module::$instance->LoadTexts(true);

        return $this->Finish(200, 'ok');

    }

    public function DeleteText(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $texts = $post->texts;
        if(!$texts) {
            return $this->Finish(400, 'Bad request');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('lang.texts.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        Module::$instance->Delete($texts);

        return $this->Finish(200, 'ok');

    }

    public function SaveText(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $text = $post->text;
        if(!$text) {
            return $this->Finish(400, 'Bad request');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('lang.texts.' . (!!$text ? '.edit' : '.add'))) {
            return $this->Finish(403, 'Permission denied');
        }

        $textKey = $text['key'];
        unset($text['key']);

        $newText = Module::$instance->Save($textKey, $text);

        return $this->Finish(200, 'ok', $newText);

    }

    public function CloudTranslate(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!Module::$instance->cloudEnabled) {
            return $this->Finish(400, 'Bad request');
        }

        $texts = $post->texts;
        if(!$texts) {
            return $this->Finish(400, 'Bad request');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('lang.texts.' . ((bool)$texts ? '.edit' : '.add'))) {
            return $this->Finish(403, 'Permission denied');
        }


        $langFrom = $post->langFrom;
        $langTo = $post->langTo;

        Module::$instance->InitApis();

        $keys = [];
        $ret = [];
        foreach($texts as $text) {

            $textKey = $text['key'];
            unset($text['key']);
    
            $keys[] = $textKey;

            $translated = Module::$instance->CloudTranslate($langFrom, $langTo, $text[$langFrom]);
            $text[$langTo] = $translated;
            
            $ret[$textKey] = Module::$instance->Save($textKey, $text);
        }

        return $this->Finish(200, 'ok', $ret);

    }


}
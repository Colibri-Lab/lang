<?php

namespace App\Modules\Lang\Controllers;

use Colibri\App;
use Colibri\Exceptions\BadRequestException;
use Colibri\Exceptions\PermissionDeniedException;
use Colibri\Web\RequestCollection;
use Colibri\Web\Controller as WebController;
use Colibri\Web\PayloadCopy;
use App\Modules\Lang\Module;
use App\Modules\Security\Module as SecurityModule;
use Colibri\Collections\Collection;

/**
 * Langs controller
 */
class LangController extends WebController
{

    /**
     * Returns a module settings
     * @param RequestCollection $get data from get request
     * @param RequestCollection $post a request post data
     * @param mixed $payload payload object in POST/PUT request
     * @return object
     */
    public function Settings(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        return $this->Finish(200, 'ok', ['cloud' => !!Module::Instance()->claudName, 'readonly' => !App::$isDev]);

    }

    /**
     * Returns a languages list
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param PayloadCopy|null $payload
     * @return object
     */
    public function Langs(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $langs = Module::Instance()->Langs();

        return $this->Finish(200, 'ok', $langs);

    }

    /**
     * Returns a list of texts
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param PayloadCopy|null $payload
     * @return object
     */
    public function Texts(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $langs = Module::Instance()->Config()->Query('config.langs')->AsObject();
        $texts = Module::Instance()->LoadTexts();

        $term = $post->{'term'} ?: '';
        $notfilled = $post->{'notfilled'} ?: false;
        $page = $post->{'page'} ?: 1;
        $pagesize = $post->{'pagesize'} ?: 50;

        $collection = new Collection($texts);
        if ($term) {
            $collection = $collection->Filter(function ($key, $value) use ($term) {
                if (strstr($key, $term) !== false) {
                    return true;
                } else {
                    foreach ($value as $lang => $v) {
                        if (strstr($v, $term) !== false) {
                            return true;
                        }
                    }
                }
            });
        }

        if ($notfilled) {

            $collection = $collection->Filter(function ($key, $value) use ($langs) {
                $keys = [];
                foreach ($value as $lang => $v) {
                    if ($v) {
                        $keys[] = $lang;
                    }
                }

                $ks = array_keys((array) $langs);
                $intersect = array_intersect($keys, $ks);
                if (count($intersect) != count($ks)) {
                    return true;
                }
            });
        }

        if ($page) {
            $collection = $collection->Extract($page, $pagesize);
        }

        return $this->Finish(200, 'ok', $collection->ToArray());

    }

    /**
     * Saves a language
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param PayloadCopy|null $payload
     * @return object
     */
    public function SaveLang(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $lang = $post->{'lang'};
        if (!$lang) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('lang.langs.' . (!!$lang ? '.edit' : '.add'))) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $langKey = $lang['key'];
        unset($lang['key']);

        $langConfig = Module::Instance()->Config()->Query('config.langs');
        $langConfig->Set($langKey, $lang);
        $langConfig->Save();

        Module::Instance()->LoadTexts(true);

        $newLang = Module::Instance()->Config()->Query('config.langs.' . $langKey)->AsObject();

        return $this->Finish(200, 'ok', $newLang);

    }

    /**
     * Deletes a language
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param PayloadCopy|null $payload
     * @return object
     */
    public function DeleteLang(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $lang = $post->{'lang'};
        if (!$lang) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('lang.langs.remove')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $langConfig = Module::Instance()->Config()->Query('config.langs');
        $langConfig->Set($lang, null);
        $langConfig->Save();

        Module::Instance()->LoadTexts(true);

        return $this->Finish(200, 'ok');

    }

    /**
     * Deletes a text translation
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param PayloadCopy|null $payload
     * @return object
     */
    public function DeleteText(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $texts = $post->{'texts'};
        if (!$texts) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('lang.texts.remove')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        Module::Instance()->Delete($texts);

        return $this->Finish(200, 'ok');

    }

    /**
     * Saves a text translation
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param PayloadCopy|null $payload
     * @return object
     */
    public function SaveText(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $text = $post->{'text'};
        if (!$text) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('lang.texts.' . (!!$text ? '.edit' : '.add'))) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $textKey = $text['key'];
        unset($text['key']);

        $newText = Module::Instance()->Save($textKey, $text);

        return $this->Finish(200, 'ok', $newText);

    }

    /**
     * Translates a data with integrated cloud translation api
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param PayloadCopy|null $payload
     * @return object
     */
    public function CloudTranslate(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!Module::Instance()->claudName) {
            throw new BadRequestException('Bad request', 400);
        }

        $texts = $post->{'texts'};
        if (!$texts) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('lang.texts.' . ((bool) $texts ? '.edit' : '.add'))) {
            throw new PermissionDeniedException('Permission denied', 403);
        }


        $langFrom = $post->{'langFrom'};
        $langTo = $post->{'langTo'};

        Module::Instance()->InitApis();

        $totranslate = [];
        foreach ($texts as $text) {
            $totranslate[] = $text[$langFrom];
        }

        $translated = Module::Instance()->CloudTranslate($langFrom, $langTo, $totranslate);
        if (!is_array($translated)) {
            $translated = [$translated];
        }

        $ret = [];
        foreach ($texts as $index => $text) {

            $textKey = $text['key'];
            unset($text['key']);

            $text[$langTo] = $translated[$index];

            $ret[$textKey] = Module::Instance()->Save($textKey, $text);
        }

        Module::Instance()->LoadTexts(true);

        return $this->Finish(200, 'ok', $ret);

    }

    /**
     * Translates an object with integrated cloud translation api
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param PayloadCopy|null $payload
     * @return object
     */
    public function CloudTranslateObject(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!Module::Instance()->claudName) {
            throw new BadRequestException('Bad request', 400);
        }

        $text = $post->{'text'};
        if (!$text) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('lang.texts.edit')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }


        $langFrom = $post->{'langFrom'};
        $langTo = $post->{'langTo'};

        Module::Instance()->InitApis();

        if ($langTo === '*') {
            $langs = Module::Instance()->Langs();
            foreach ($langs as $key => $langData) {
                if ($key !== $langFrom) {
                    $text[$key] = Module::Instance()->CloudTranslate($langFrom, $key, $text[$langFrom]);
                }
            }
        } else {
            $text[$langTo] = Module::Instance()->CloudTranslate($langFrom, $langTo, $text[$langFrom]);
        }

        return $this->Finish(200, 'ok', $text);

    }

}
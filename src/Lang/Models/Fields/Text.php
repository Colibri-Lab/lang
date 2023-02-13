<?php

/**
 * Fields
 *
 * @author Vahan P. Grigoryan <vahan.grigoryan@gmail.com>
 * @copyright 2019 Colibri
 * @package App\Modules\Lang\Models\Fields
 */
namespace App\Modules\Lang\Models\Fields;

use Colibri\App;
use Colibri\Data\Storages\Fields\Field;
use Colibri\Data\Storages\Fields\ObjectField;
use Colibri\Data\Storages\Models\DataRow;
use Colibri\Data\Storages\Storage;


class Text extends ObjectField
{
    public const JsonSchema = [
        'type' => 'object',
        'patternProperties' => [
            '.*' => [
                'type' => ['string', 'null']
            ]
        ]
    ];

    public function __construct(mixed $data, ? Storage $storage = null, ? Field $field = null, ? DataRow $datarow = null)
    {
        parent::__construct($data, $storage, $field);

        $langModule = App::$moduleManager->Get('lang');

        $langs = $langModule->Langs();
        foreach ($langs as $lang => $langData) {
            $this->_field->AddField($lang, [
                'type' => 'varchar',
                'length' => '4096',
                'class' => 'string',
                'component' => 'Text',
                'default' => '',
                'description' => ''
            ]);
        }

    }

}
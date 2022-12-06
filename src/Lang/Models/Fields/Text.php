<?php

/**
 * Fields
 *
 * @author Vahan P. Grigoryan <vahan.grigoryan@gmail.com>
 * @copyright 2019 Colibri
 * @package App\Modules\Lang\Models\Fields
 */
namespace App\Modules\Lang\Models\Fields;
use Colibri\Data\Storages\Fields\ObjectField;


class Text extends ObjectField
{ 
    public const JsonSchema = [
        'type' => 'object',
        'patternProperties' => [
            '.*' => [
                'type' => 'string'
            ]
        ]
    ];


}
<?php

/**
 * Fields
 *
 * @author Vahan P. Grigoryan <vahan.grigoryan@gmail.com>
 * @copyright 2019 Colibri
 * @package App\Modules\Lang\Models\Fields
 */
namespace App\Modules\Lang\Models\Fields;
use Colibri\Utils\ExtendedObject;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Fields\Field;
use Colibri\Data\Storages\Models\DataRow;


class Text extends ExtendedObject
{ 

     /**
     * Конструктор
     * @param string|mixed[string] $data данные
     * @param Storage $storage хранилище
     * @param Field $field поле
     * @return void
     */
    public function __construct(mixed $data, ?Storage $storage = null, ?Field $field = null, ?DataRow $datarow = null)
    {
        parent::__construct(is_string($data) ? (array)json_decode($data) : (array)$data, '', false);
        $this->_storage = $storage;
        $this->_field = $field;
        $this->_datarow = $datarow;
    }

    

}
<?php
use App\Modules\Lang\Module;


$langs = Module::Instance()->Langs();

?>

<script>const LangData = <?=json_encode($langs, JSON_UNESCAPED_UNICODE)?>;</script>
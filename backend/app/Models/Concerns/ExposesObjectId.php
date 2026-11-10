<?php

namespace App\Models\Concerns;

/**
 * O driver serializa a chave do Mongo como `id`. O front do Basileia lê
 * ora `id`, ora `_id`, então expomos as duas e evitamos um ajuste em
 * cada tela que consome a API.
 */
trait ExposesObjectId
{
    public function toArray(): array
    {
        $array = parent::toArray();

        if (isset($array['id']) && ! isset($array['_id'])) {
            $array['_id'] = (string) $array['id'];
        }

        if (isset($array['id'])) {
            $array['id'] = (string) $array['id'];
        }

        return $array;
    }
}

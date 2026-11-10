"use client";

import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";

const PREFIX = "basileia:list-state:";

/**
 * useState persistido em sessionStorage (escopo da aba).
 * Usado em listagens para que filtros, aba ativa e paginação sobrevivam
 * à navegação para telas filhas (histórico, edição, detalhe) e ao retorno.
 * Só guarda valores serializáveis (string/number/boolean/objetos simples).
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const storageKey = PREFIX + key;
  const initialRef = useRef(initialValue);

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (JSON.stringify(value) === JSON.stringify(initialRef.current)) {
        window.sessionStorage.removeItem(storageKey);
      } else {
        window.sessionStorage.setItem(storageKey, JSON.stringify(value));
      }
    } catch {
      /* storage indisponível: segue só em memória */
    }
  }, [storageKey, value]);

  return [value, setValue];
}

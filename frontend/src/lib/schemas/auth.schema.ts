import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "E-mail obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
  remember: z.boolean().optional().default(true),
  captcha: z.string().min(1, "Por favor, confirme que você é humano"),
});

export const registerSchema = z.object({
  country: z.string().optional().default("BR"),
  churchName: z.string().min(3, "Nome da igreja é obrigatório e deve ter no mínimo 3 caracteres."),
  documentNumber: z.string().optional().or(z.literal("")),
  responsibleName: z.string().min(3, "Nome do responsável é obrigatório."),
  responsibleEmail: z.string().email("E-mail inválido."),
  responsiblePhone: z.string().min(10, "Telefone inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  passwordConfirm: z.string(),
  captcha: z.string().min(1, "Por favor, confirme que você é humano"),
}).superRefine((data, ctx) => {
  if (data.password !== data.passwordConfirm) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Senhas não coincidem",
      path: ["passwordConfirm"],
    });
  }
  if (data.country === "BR") {
    const docDigits = (data.documentNumber || "").replace(/\D/g, "");
    if (docDigits.length < 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O CPF/CNPJ é obrigatório e deve ser válido para igrejas no Brasil",
        path: ["documentNumber"],
      });
    }
  }
});

export type LoginPayload    = z.infer<typeof loginSchema>;
export type RegisterPayload = z.infer<typeof registerSchema>;

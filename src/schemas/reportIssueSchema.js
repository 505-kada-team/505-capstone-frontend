import { z } from 'zod';

export const reportIssueSchema = z
  .object({
    planId: z.string().min(1, 'Plan wajib tersedia'),
    category: z.enum(['menu', 'ingredient'], {
      message: 'Category wajib dipilih',
    }),
    refId: z.string().min(1, 'Item wajib dipilih'),
    quantityLost: z.coerce.number().positive('Quantity lost harus lebih dari 0'),
    incidentAt: z.string().min(1, 'Incident date wajib diisi'),
    reason: z.string().min(1, 'Reason wajib diisi').max(500, 'Reason maksimal 500 karakter'),
  })
  .superRefine((data, ctx) => {
    if (data.category === 'menu' && !Number.isInteger(data.quantityLost)) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantityLost'],
        message: 'Quantity lost untuk menu harus berupa bilangan bulat',
      });
    }

    if (data.incidentAt && new Date(data.incidentAt) > new Date()) {
      ctx.addIssue({
        code: 'custom',
        path: ['incidentAt'],
        message: 'Incident date tidak boleh di masa depan',
      });
    }
  });
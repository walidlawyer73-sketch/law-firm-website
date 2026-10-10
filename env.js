const { z } = require('zod');

const envSchema = z.object({
    MONGODB_URI: z.string().min(1, 'MONGODB_URI مطلوب ويجب أن يكون رابطاً صحيحاً'),
    EMAIL_USER: z.string().email('EMAIL_USER يجب أن يكون بريداً إلكترونياً صحيحاً'),
    EMAIL_PASS: z.string().min(8, 'EMAIL_PASS مطلوب (8 أحرف على الأقل)'),
    ADMIN_EMAIL: z.string().email('ADMIN_EMAIL يجب أن يكون بريداً إلكترونياً صحيحاً'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error('\n❌ خطأ في إعدادات البيئة:\n');
    result.error.issues.forEach((issue) => {
        console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });
    console.error('\n🔧 راجع Environment Variables على Vercel أو ملف .env المحلي.\n');
    process.exit(1);
}

module.exports = result.data;
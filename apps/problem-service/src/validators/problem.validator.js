const { z } = require('zod');

// --- functionSignature type vocabulary -------------------------------------
//
// Canonical shape: { name, params: [{ name, type }], returnType }. `type` and
// `returnType` are deliberately NULLABLE, not required — the 11 seeded
// problems (ported from the frontend mock, which has no per-param types at
// all) have both as `null`, and nothing in the approved requirements makes a
// type mandatory. This schema validates a `type` value when one is present;
// it never requires one.
//
// Vocabulary is the one approved in the architecture proposal: six
// primitives, 1D/2D arrays of them, and the two reference structures needed
// by the seeded problems that operate on linked lists / trees.
const PRIMITIVE_TYPES = ['int', 'long', 'double', 'boolean', 'string', 'char'];
const REFERENCE_TYPES = ['ListNode', 'TreeNode'];
const TYPE_PATTERN = new RegExp(`^(?:${[...PRIMITIVE_TYPES, ...REFERENCE_TYPES].join('|')})(?:\\[\\]){0,2}$`);

const typeSchema = z.string().trim().regex(TYPE_PATTERN, 'Unsupported type').nullable();

const paramSchema = z
  .object({
    name: z.string().trim().min(1, 'Parameter name is required'),
    type: typeSchema,
  })
  .strict();

const functionSignatureSchema = z
  .object({
    name: z.string().trim().min(1, 'Function name is required'),
    params: z.array(paramSchema),
    returnType: typeSchema,
  })
  .strict();

// --- shared field schemas ---------------------------------------------------

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(80, 'Slug must be at most 80 characters')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase, kebab-case (e.g. "two-sum")');

const titleSchema = z.string().trim().min(1, 'Title is required').max(200, 'Title must be at most 200 characters');

// Public-facing casing ("Easy"/"Medium"/"Hard"), matching the frontend's
// existing vocabulary — transformed to the Prisma enum value for storage, so
// this mapping lives in exactly one place rather than being repeated by every
// future caller.
const difficultySchema = z.enum(['Easy', 'Medium', 'Hard']).transform((value) => value.toUpperCase());

const summarySchema = z.string().trim().min(1, 'Summary is required').max(300, 'Summary must be at most 300 characters');

const descriptionSchema = z.string().trim().min(1, 'Description is required').max(5000, 'Description must be at most 5000 characters');

// No baked-in `.default()` here deliberately — problemUpdateSchema reuses
// these bare, and a baked-in default would make Zod fill in `constraints: []`
// / `tags: []` even when the caller omitted the key entirely, which would
// silently defeat the "at least one field must be provided" check below.
// problemCreateSchema applies `.default([])` itself, at the point of use.
const constraintsSchema = z.array(z.string().trim().min(1));

const tagsSchema = z.array(z.string().trim().min(1).max(50));

const exampleSchema = z
  .object({
    input: z.string().trim().min(1, 'Example input is required'),
    output: z.string().trim().min(1, 'Example output is required'),
    explanation: z.string().trim().nullable().optional(),
  })
  .strict();

const examplesSchema = z.array(exampleSchema);

// --- problem create/update ---------------------------------------------------
//
// Not wired to any endpoint yet (admin CRUD is a later milestone) — provided
// now so the future controller/service layer has a ready, reusable schema,
// per this milestone's validation-layer scope.

const problemCreateSchema = z
  .object({
    slug: slugSchema,
    title: titleSchema,
    difficulty: difficultySchema,
    summary: summarySchema,
    description: descriptionSchema,
    constraints: constraintsSchema.default([]),
    tags: tagsSchema.default([]),
    functionSignature: functionSignatureSchema,
    examples: examplesSchema,
    isPublished: z.boolean().optional(),
  })
  .strict();

const problemUpdateSchema = z
  .object({
    slug: slugSchema.optional(),
    title: titleSchema.optional(),
    difficulty: difficultySchema.optional(),
    summary: summarySchema.optional(),
    description: descriptionSchema.optional(),
    constraints: constraintsSchema.optional(),
    tags: tagsSchema.optional(),
    functionSignature: functionSignatureSchema.optional(),
    examples: examplesSchema.optional(),
    isPublished: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// --- public listing query ---------------------------------------------------
//
// Matches the approved GET /problems contract exactly: search/difficulty/tag
// filters, page/pageSize pagination, fixed createdAt-desc ordering. There is
// no sort parameter in the approved contract, so none is validated here.

const listProblemsQuerySchema = z
  .object({
    search: z.string().trim().optional().default(''),
    difficulty: z.enum(['Easy', 'Medium', 'Hard', 'all']).optional().default('all'),
    tag: z.string().trim().optional().default('all'),
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(50).optional().default(8),
  })
  .strict()
  .transform(({ search, difficulty, tag, page, pageSize }) => ({
    search: search || undefined,
    difficulty: difficulty === 'all' ? undefined : difficulty.toUpperCase(),
    tag: tag === 'all' ? undefined : tag,
    page,
    pageSize,
  }));

module.exports = {
  functionSignatureSchema,
  slugSchema,
  problemCreateSchema,
  problemUpdateSchema,
  listProblemsQuerySchema,
};

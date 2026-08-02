const { z } = require('zod');

const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(50).optional(),
    lastName: z.string().trim().min(1, 'Last name is required').max(50).optional(),
    avatar: z.string().trim().url('Avatar must be a valid URL').max(2048).nullable().optional(),
    bio: z.string().trim().max(500, 'Bio must be at most 500 characters').nullable().optional(),
    country: z.string().trim().max(100, 'Country must be at most 100 characters').nullable().optional(),
    college: z.string().trim().max(150, 'College must be at most 150 characters').nullable().optional(),
    githubUrl: z.string().trim().url('GitHub URL must be a valid URL').max(2048).nullable().optional(),
    linkedinUrl: z.string().trim().url('LinkedIn URL must be a valid URL').max(2048).nullable().optional(),
    portfolioUrl: z.string().trim().url('Portfolio URL must be a valid URL').max(2048).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

module.exports = {
  updateProfileSchema,
};

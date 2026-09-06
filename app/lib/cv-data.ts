// Normalizes a parsed CV object into the shape the Prisma `CV` model
// expects.
//
// The Claude extraction prompt in app/api/cv/route.ts returns snake_case
// keys (experience_years, job_search_keywords, ...), but the Prisma
// schema uses camelCase (experienceYears) and has no job_search_keywords
// column at all. prisma.cV.upsert() throws on any key it doesn't
// recognize, so spreading the raw extraction result straight into
// `data` (as both app/api/cv/route.ts and app/api/user/cv/route.ts used
// to do) throws "Unknown argument `experience_years`" on every save —
// which was being masked by the earlier referralCode collision bug
// (that failed one step earlier, while creating the User row) and only
// became visible once that was fixed.
export function toCvRecord(cvData: any) {
  return {
    name: cvData?.name || null,
    email: cvData?.email || null,
    phone: cvData?.phone || null,
    location: cvData?.location || null,
    title: cvData?.title || null,
    summary: cvData?.summary || null,
    skills: Array.isArray(cvData?.skills) ? cvData.skills : [],
    experienceYears:
      typeof cvData?.experience_years === 'number'
        ? cvData.experience_years
        : typeof cvData?.experienceYears === 'number'
        ? cvData.experienceYears
        : null,
    education: cvData?.education || null,
    languages: Array.isArray(cvData?.languages) ? cvData.languages : [],
    experience: Array.isArray(cvData?.experience) ? cvData.experience : [],
  };
}

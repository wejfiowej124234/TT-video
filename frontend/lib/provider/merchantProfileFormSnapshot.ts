export type MerchantProfileFormFields = {
  shopName: string;
  city: string;
  countryCode: string;
  categories: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
};

export function merchantProfileFormSnapshot(fields: MerchantProfileFormFields): string {
  return JSON.stringify({
    shopName: fields.shopName.trim(),
    city: fields.city.trim(),
    countryCode: fields.countryCode.trim(),
    categories: fields.categories.trim(),
    bio: fields.bio.trim(),
    avatarUrl: fields.avatarUrl.trim(),
    coverUrl: fields.coverUrl.trim(),
  });
}

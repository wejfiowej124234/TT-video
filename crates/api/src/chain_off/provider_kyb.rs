//! 商家入驻 KYB 分国规则与字段校验（① 本地 · Phase A）。

use serde::{Deserialize, Serialize};
use traveltrust_core::product_countries::normalize_iso_country_code;

pub const ENTITY_COMPANY: &str = "company";
pub const ENTITY_INDIVIDUAL: &str = "individual";

pub const ID_TYPE_PASSPORT: &str = "passport";
pub const ID_TYPE_NATIONAL_ID: &str = "national_id";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ProviderKybCountryRule {
    pub requires_travel_agency_permit: bool,
}

/// 分国证照规则（stub · ① 本地）：**CN** / **TH** 须额外旅行社许可证；其余十国仅营业执照。
pub fn kyb_rule_for_country(country_code: &str) -> ProviderKybCountryRule {
    match country_code.trim().to_uppercase().as_str() {
        "CN" | "TH" => ProviderKybCountryRule {
            requires_travel_agency_permit: true,
        },
        _ => ProviderKybCountryRule {
            requires_travel_agency_permit: false,
        },
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct ProviderAddressBody {
    pub line1: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub line2: Option<String>,
    pub city: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub postal_code: Option<String>,
    pub country_code: String,
}

impl ProviderAddressBody {
    pub fn normalized(&self) -> Option<Self> {
        let country = normalize_iso_country_code(&self.country_code)?;
        let line1 = self.line1.trim();
        let city = self.city.trim();
        if line1.is_empty() || city.is_empty() {
            return None;
        }
        Some(Self {
            line1: line1.to_string(),
            line2: self
                .line2
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string()),
            city: city.to_string(),
            postal_code: self
                .postal_code
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string()),
            country_code: country.to_string(),
        })
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct BeneficialOwnerBody {
    pub full_name: String,
    pub id_type: String,
    pub id_number: String,
    pub id_doc_url: String,
}

impl BeneficialOwnerBody {
    pub fn normalized(&self) -> Option<Self> {
        let full_name = self.full_name.trim();
        let id_type = self.id_type.trim().to_ascii_lowercase();
        let id_number = self.id_number.trim();
        let id_doc_url = self.id_doc_url.trim();
        if full_name.is_empty()
            || id_number.is_empty()
            || id_doc_url.is_empty()
            || !matches!(id_type.as_str(), ID_TYPE_PASSPORT | ID_TYPE_NATIONAL_ID)
        {
            return None;
        }
        Some(Self {
            full_name: full_name.to_string(),
            id_type: id_type,
            id_number: id_number.to_string(),
            id_doc_url: id_doc_url.to_string(),
        })
    }
}

#[derive(Debug, Clone)]
pub struct NormalizedProviderKybInput {
    pub entity_type: String,
    pub country_code: String,
    pub registered_address: ProviderAddressBody,
    pub operating_address: ProviderAddressBody,
    pub beneficial_owners: Vec<BeneficialOwnerBody>,
    pub legal_representative_id_url: Option<String>,
    pub travel_agency_permit_url: Option<String>,
}

pub fn normalize_entity_type(raw: &str) -> Option<String> {
    let t = raw.trim().to_ascii_lowercase();
    match t.as_str() {
        ENTITY_COMPANY | ENTITY_INDIVIDUAL => Some(t),
        _ => None,
    }
}

fn non_empty_url(raw: Option<&str>) -> Option<String> {
    raw.map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
}

/// 校验并归一化 KYB 扩展字段；失败返回机器键 **`error`**。
pub fn validate_provider_kyb_fields(
    entity_type: &str,
    country_code: &str,
    registered_address: &ProviderAddressBody,
    operating_same_as_registered: bool,
    operating_address: Option<&ProviderAddressBody>,
    beneficial_owners: &[BeneficialOwnerBody],
    legal_representative_id_url: Option<&str>,
    travel_agency_permit_url: Option<&str>,
) -> Result<NormalizedProviderKybInput, &'static str> {
    let entity_type = normalize_entity_type(entity_type)
        .ok_or("provider_application_invalid_entity_type")?;
    let country_code = normalize_iso_country_code(country_code)
        .ok_or("provider_application_invalid_country_code")?;

    let registered_address = registered_address
        .normalized()
        .ok_or("provider_application_registered_address_required")?;
    if registered_address.country_code != country_code {
        return Err("provider_application_registered_address_country_mismatch");
    };    let operating_address = if operating_same_as_registered {
        registered_address.clone()
    } else {
        let op = operating_address
            .and_then(|a| a.normalized())
            .ok_or("provider_application_operating_address_required")?;
        if op.country_code != country_code {
            return Err("provider_application_operating_address_country_mismatch");
        }
        op
    };
    let travel_agency_permit_url = non_empty_url(travel_agency_permit_url);
    let rule = kyb_rule_for_country(&country_code);
    if rule.requires_travel_agency_permit && travel_agency_permit_url.is_none() {
        return Err("provider_application_travel_agency_permit_required");
    };    let legal_representative_id_url = non_empty_url(legal_representative_id_url);
    let mut owners: Vec<BeneficialOwnerBody> = Vec::new();
    if entity_type == ENTITY_COMPANY {
        if beneficial_owners.is_empty() {
            return Err("provider_application_beneficial_owners_required");
        }
        for owner in beneficial_owners {
            owners.push(
                owner
                    .normalized()
                    .ok_or("provider_application_beneficial_owner_invalid")?,
            );
        }
    } else if legal_representative_id_url.is_none() {
        return Err("provider_application_legal_representative_id_required");
    }

    Ok(NormalizedProviderKybInput {
        entity_type,
        country_code: country_code.to_string(),
        registered_address,
        operating_address,
        beneficial_owners: owners,
        legal_representative_id_url,
        travel_agency_permit_url,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn addr(line1: &str, city: &str, country: &str) -> ProviderAddressBody {
        ProviderAddressBody {
            line1: line1.to_string(),
            line2: None,
            city: city.to_string(),
            postal_code: None,
            country_code: country.to_string(),
        }
    }

    fn owner(name: &str) -> BeneficialOwnerBody {
        BeneficialOwnerBody {
            full_name: name.to_string(),
            id_type: ID_TYPE_PASSPORT.to_string(),
            id_number: "P123456".to_string(),
            id_doc_url: "/api/v1/uploads/guides/x.pdf".to_string(),
        }
    }

    #[test]
    fn cn_requires_travel_agency_permit() {
        let rule = kyb_rule_for_country("CN");
        assert!(rule.requires_travel_agency_permit);
        let rule = kyb_rule_for_country("US");
        assert!(!rule.requires_travel_agency_permit);
    }

    #[test]
    fn company_requires_beneficial_owners() {
        let err = validate_provider_kyb_fields(
            ENTITY_COMPANY,
            "CN",
            &addr("Reg St 1", "北京", "CN"),
            true,
            None,
            &[],
            None,
            Some("/api/v1/uploads/guides/permit.pdf"),
        )
        .unwrap_err();
        assert_eq!(err, "provider_application_beneficial_owners_required");
    }

    #[test]
    fn individual_requires_legal_rep_id() {
        let err = validate_provider_kyb_fields(
            ENTITY_INDIVIDUAL,
            "US",
            &addr("123 Main", "纽约", "US"),
            true,
            None,
            &[],
            None,
            None,
        )
        .unwrap_err();
        assert_eq!(err, "provider_application_legal_representative_id_required");
    }

    #[test]
    fn cn_company_ok_with_permit_and_ubo() {
        let out = validate_provider_kyb_fields(
            ENTITY_COMPANY,
            "CN",
            &addr("Reg St 1", "北京", "CN"),
            true,
            None,
            &[owner("Zhang San")],
            None,
            Some("/api/v1/uploads/guides/permit.pdf"),
        )
        .expect("valid");
        assert_eq!(out.country_code, "CN");
        assert_eq!(out.beneficial_owners.len(), 1);
    }
}

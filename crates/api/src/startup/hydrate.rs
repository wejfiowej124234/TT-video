//! 从 DB 将 users/sessions/guides/orders/reviews/disputes/itineraries/order_messages 灌入 chain_off store（48 优化：自 startup 拆出）

use traveltrust_core::OrderState;

use crate::chain_off;
use crate::db;

/// 使用当前 DB 数据填充 chain_off store；有池时由 run() 调用。
pub async fn hydrate_from_db(
    pool: &sqlx::PgPool,
    store: &mut chain_off::ChainOffStore,
) -> Result<(), String> {
    let users = db::list_users(pool).await.map_err(|e| e.to_string())?;
    let sessions = db::list_sessions(pool).await.map_err(|e| e.to_string())?;
    for u in users {
        store.users.insert(
            u.id,
            chain_off::UserRow {
                id: u.id,
                email: u.email,
                password_hash: u.password_hash,
                role: u.role,
                kyc_status: u.kyc_status,
                nickname: u.nickname,
                avatar_url: u.avatar_url,
                default_wallet_address: u.default_wallet_address,
                created_at: u.created_at,
                updated_at: u.updated_at,
            },
        );
    }
    for s in sessions {
        store.sessions.insert(s.token, s.user_id);
    }
    if let Ok(verified) = db::list_user_email_verified_at(pool).await {
        for (user_id, verified_at) in verified {
            store.user_email_verified_at.insert(user_id, verified_at);
        }
    }
    if let Ok(exit_rows) = db::list_guide_exit_requests(pool).await {
        for row in exit_rows {
            store.guide_exit_requests_by_guide.insert(
                row.guide_id,
                chain_off::GuideExitRequestRow {
                    id: row.id,
                    guide_id: row.guide_id,
                    user_id: row.user_id,
                    status: row.status,
                    reason: row.reason,
                    requested_at: row.requested_at,
                    updated_at: row.updated_at,
                },
            );
        }
    }
    if let Ok(guides) = db::list_guides(pool).await {
        for g in guides {
            let guide_row = chain_off::GuideRow {
                id: g.id,
                user_id: g.user_id,
                city: g.city,
                country_code: g.country_code,
                languages: crate::chain_off::market_guide_filter::normalize_languages_for_storage(
                    &g.languages,
                ),
                service_types:
                    crate::chain_off::market_guide_filter::normalize_service_types_for_storage(
                        &g.service_types,
                    ),
                bio: g.bio,
                wallet_address: g.wallet_address,
                real_name: g.real_name,
                passport_number_hash: g.passport_number_hash,
                id_photo_url: g.id_photo_url,
                language_cert_url: g.language_cert_url,
                guide_license_url: g.guide_license_url,
                stake_amount: g.stake_amount,
                hourly_rate: g.hourly_rate,
                avatar_url: g.avatar_url,
                public_title: g.public_title,
                status: g.status,
                rejection_codes: g.rejection_codes,
                rejection_message: g.rejection_message,
                data_origin: g.data_origin.clone(),
                display_status: g.display_status.clone(),
                display_origin: g.display_origin.clone(),
                featured: g.featured,
                display_priority: g.display_priority,
                display_surfaces: g.display_surfaces.clone(),
                display_start_at: g.display_start_at,
                display_end_at: g.display_end_at,
                created_at: g.created_at,
                updated_at: g.updated_at,
            };
            store.guides.insert(g.id, guide_row);
            store
                .guides_by_user
                .entry(g.user_id)
                .and_modify(|existing_id| {
                    let keep_existing = store
                        .guides
                        .get(existing_id)
                        .is_some_and(|existing| existing.updated_at >= g.updated_at);
                    if !keep_existing {
                        *existing_id = g.id;
                    }
                })
                .or_insert(g.id);
        }
    }
    if let Ok(orders) = db::list_orders(pool).await {
        for o in orders {
            let order_row = chain_off::order_from_db(&o);
            let (id, guide_id, state) = (order_row.id, order_row.guide_id, order_row.state);
            store.orders.insert(id, order_row);
            if state == OrderState::Accepted || state == OrderState::Escrowed {
                store.guide_slot.insert(guide_id, id);
            }
        }
    }
    if let Ok(reviews) = db::list_reviews(pool).await {
        for r in reviews {
            store.reviews.push(chain_off::ReviewRow {
                id: r.id,
                order_id: r.order_id,
                reviewer_id: r.reviewer_id,
                reviewee_id: r.reviewee_id,
                score: r.score,
                weight: r.weight,
                comment: r.comment,
                created_at: r.created_at,
            });
        }
    }
    if let Ok(disputes) = db::list_disputes(pool).await {
        for d in disputes {
            let ev: Vec<String> =
                serde_json::from_value(d.evidence_hashes.clone()).unwrap_or_default();
            store.disputes.insert(
                d.id,
                chain_off::DisputeRow {
                    id: d.id,
                    order_id: d.order_id,
                    status: d.status,
                    evidence_hashes: ev,
                    arbitrator_id: d.arbitrator_id,
                    refund_ratio: d.refund_ratio,
                    slash_guide: d.slash_guide,
                    resolved_at: d.resolved_at,
                    created_at: d.created_at,
                    updated_at: d.updated_at,
                    arb_fee_paid: d.arb_fee_paid,
                    dispute_sequence: d.dispute_sequence as u32,
                },
            );
            store.disputes_by_order.insert(d.order_id, d.id);
        }
    }
    if let Ok(itineraries) = db::list_itineraries(pool).await {
        for row in itineraries {
            let days: Vec<chain_off::ItineraryDayRow> =
                serde_json::from_value(row.days_json.clone()).unwrap_or_default();
            let amount_breakdown: chain_off::AmountBreakdown = row
                .amount_breakdown_json
                .as_ref()
                .and_then(|j| serde_json::from_value(j.clone()).ok())
                .unwrap_or(chain_off::AmountBreakdown {
                    hotel: 0.0,
                    catering: 0.0,
                    tickets: 0.0,
                    guide_fee: 0.0,
                    vehicle: 0.0,
                    platform_fee: 0.0,
                    total_budget: 0.0,
                });
            let cover_image = chain_off::infer_cover_image_from_days(&days);
            store.itineraries.insert(
                row.order_id,
                chain_off::ItineraryBundle {
                    order_id: row.order_id,
                    version: row.version as u32,
                    destination: row.destination,
                    city: row.city,
                    days,
                    amount_breakdown,
                    snapshot_hash: row.snapshot_hash,
                    cover_image,
                },
            );
        }
    }
    if let Ok(messages) = db::list_order_messages_all(pool).await {
        for row in messages {
            store
                .messages
                .entry(row.order_id)
                .or_default()
                .push(chain_off::MessageRow {
                    id: row.id,
                    order_id: row.order_id,
                    sender_id: row.sender_id,
                    content: row.content,
                    created_at: row.created_at,
                });
        }
    }
    if let Ok(receipts) = db::list_all_evidence_receipts(pool).await {
        for r in receipts {
            store.evidence_receipts.entry(r.order_id).or_default().push(
                chain_off::EvidenceReceiptRow {
                    content_hash: r.content_hash,
                    created_at: r.created_at,
                    uploader_id: r.uploader_id,
                    schema_version: r.schema_version,
                    prompt_version: r.prompt_version,
                    snapshot_hash: r.snapshot_hash,
                    quote_hash: r.quote_hash,
                },
            );
        }
    }
    println!(
        "database: hydrated {} users, {} sessions, {} guides, {} orders, {} reviews, {} disputes, {} itineraries, {} order_messages, {} evidence_receipts into chain_off",
        store.users.len(),
        store.sessions.len(),
        store.guides.len(),
        store.orders.len(),
        store.reviews.len(),
        store.disputes.len(),
        store.itineraries.len(),
        store.messages.values().map(|v| v.len()).sum::<usize>(),
        store.evidence_receipts.values().map(|v| v.len()).sum::<usize>()
    );
    Ok(())
}

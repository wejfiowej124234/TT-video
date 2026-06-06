use axum::response::Response;

use super::tick_apply_inserted_chain;
use super::tick_apply_inserted_orders;
use super::tick_types::TickInsertedCtx;

pub(crate) async fn tick_apply_inserted_event(
    ctx: &TickInsertedCtx<'_>,
) -> Result<(u32, u32), Response> {
    let (p5_delta, region_delta) = tick_apply_inserted_chain::apply(ctx).await?;
    tick_apply_inserted_orders::apply(ctx).await?;
    Ok((region_delta, p5_delta))
}

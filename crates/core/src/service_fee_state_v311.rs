//! V3.1.1 Distributable Platform Service Fee state machine · Gap BE-01
//! Mirrors `contracts/src/ServiceFeeStatesV311.sol` (Phase A · Scope Freeze + Protocol v2 prep).

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ServiceFeeState {
    Pending,
    Locked,
    /// Protocol v2 gate (Step 2.5) · preferred before Distributable
    SettlementReady,
    Distributable,
    Distributed,
}

impl ServiceFeeState {
    pub fn can_transition(self, to: ServiceFeeState) -> bool {
        matches!(
            (self, to),
            (Self::Pending, Self::Locked)
                // TARGET: Locked → SettlementReady → Distributable
                | (Self::Locked, Self::SettlementReady)
                | (Self::SettlementReady, Self::Distributable)
                // LEGACY_COMPAT: Escrow.release still jumps Locked→Distributable until rewired
                | (Self::Locked, Self::Distributable)
                | (Self::Distributable, Self::Distributed)
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn be01_happy_path_and_illegal() {
        assert!(ServiceFeeState::Pending.can_transition(ServiceFeeState::Locked));
        assert!(ServiceFeeState::Locked.can_transition(ServiceFeeState::Distributable));
        assert!(ServiceFeeState::Distributable.can_transition(ServiceFeeState::Distributed));
        assert!(!ServiceFeeState::Pending.can_transition(ServiceFeeState::Distributed));
        assert!(!ServiceFeeState::Distributed.can_transition(ServiceFeeState::Pending));
    }

    #[test]
    fn v2_settlement_ready_no_skip() {
        assert!(ServiceFeeState::Locked.can_transition(ServiceFeeState::SettlementReady));
        assert!(ServiceFeeState::SettlementReady.can_transition(ServiceFeeState::Distributable));
        assert!(!ServiceFeeState::SettlementReady.can_transition(ServiceFeeState::Distributed));
        assert!(!ServiceFeeState::Pending.can_transition(ServiceFeeState::SettlementReady));
    }
}

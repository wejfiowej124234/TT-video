use super::super::mp4::mp4_mvhd_duration_sec;
use super::super::webm::{
    webm_segment_duration_sec, DURATION_ID, INFO_ID, SEGMENT_ID, TIMESTAMP_SCALE_ID,
};
use super::video::enforce_community_video_duration_with_max;

#[test]
fn e2e_fixture_mp4_mvhd_in_range() {
    use std::fs;
    use std::path::PathBuf;

    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../frontend/e2e/fixtures/minimal-1s-h264.mp4");
    if !p.is_file() {
        return;
    };    let bytes = fs::read(&p).expect("read mp4 fixture");
    let d = mp4_mvhd_duration_sec(&bytes).expect("mvhd duration");
    assert!(d > 0.2 && d < 5.0, "unexpected duration {d}");
    assert_eq!(
        enforce_community_video_duration_with_max(&bytes, ".mp4", 180),
        Ok(())
    );
    assert_eq!(
        enforce_community_video_duration_with_max(&bytes, ".mp4", 0),
        Err("video_too_long")
    );
}

#[test]
fn webm_truncated_ebml_is_metadata_unreadable() {
    let bytes = vec![0x1A, 0x45, 0xDF, 0xA3];
    assert_eq!(webm_segment_duration_sec(&bytes), None);
    assert_eq!(
        enforce_community_video_duration_with_max(&bytes, ".webm", 180),
        Err("video_metadata_unreadable")
    );
}

#[test]
fn synthetic_segment_webm_parses_five_seconds() {
    let d5k = 5000.0f32.to_be_bytes();
    let mut info_inner = Vec::new();
    info_inner.extend_from_slice(TIMESTAMP_SCALE_ID);
    info_inner.push(0x83);
    info_inner.extend_from_slice(&[0x0F, 0x42, 0x40]);
    info_inner.extend_from_slice(DURATION_ID);
    info_inner.push(0x84);
    info_inner.extend_from_slice(&d5k);
    assert_eq!(info_inner.len(), 14);

    let mut buf = Vec::new();
    buf.extend_from_slice(SEGMENT_ID);
    buf.push(0x93);
    buf.extend_from_slice(INFO_ID);
    buf.push(0x8E);
    buf.extend_from_slice(&info_inner);

    let d = webm_segment_duration_sec(&buf).expect("duration");
    assert!((d - 5.0).abs() < 0.001, "got {d}");
    assert_eq!(
        enforce_community_video_duration_with_max(&buf, ".webm", 4),
        Err("video_too_long")
    );
    assert_eq!(
        enforce_community_video_duration_with_max(&buf, ".webm", 180),
        Ok(())
    );
}

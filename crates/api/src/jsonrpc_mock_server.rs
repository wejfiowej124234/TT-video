//! 仅单元测试：完整读取 HTTP/1.1 请求（头 + Content-Length 体），避免单次 `read` 在 Windows 上分片导致 JSON-RPC mock 错位。

use tokio::io::AsyncReadExt;
use tokio::net::TcpStream;

fn header_body_split(buf: &[u8]) -> Option<usize> {
    buf.windows(4).position(|w| w == b"\r\n\r\n").map(|i| i + 4)
}

fn parse_content_length(headers: &[u8]) -> std::io::Result<usize> {
    let s = std::str::from_utf8(headers).map_err(|e| {
        std::io::Error::new(std::io::ErrorKind::InvalidData, e)
    })?;
    let mut cl = 0usize;
    let mut found = false;
    for line in s.split("\r\n") {
        let lower = line.to_ascii_lowercase();
        if let Some(rest) = lower.strip_prefix("content-length:") {
            cl = rest.trim().parse().map_err(|_| {
                std::io::Error::new(std::io::ErrorKind::InvalidData, "invalid content-length")
            })?;
            found = true;
            break;
        }
    }
    if !found {
        return Ok(0);
    }
    Ok(cl)
}

/// 读到完整请求（至少含头；若有 `Content-Length` 则含体），供 mock 再写 JSON-RPC 响应。
pub async fn read_http_request_headers_and_body(socket: &mut TcpStream) -> std::io::Result<Vec<u8>> {
    let mut buf = Vec::new();
    let mut tmp = [0u8; 4096];
    loop {
        let n = socket.read(&mut tmp).await?;
        if n == 0 {
            if buf.is_empty() {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::UnexpectedEof,
                    "eof before any bytes",
                ));
            }
            break;
        }
        buf.extend_from_slice(&tmp[..n]);
        if let Some(he) = header_body_split(&buf) {
            let cl = parse_content_length(&buf[..he.saturating_sub(4)])?;
            if buf.len() >= he + cl {
                break;
            }
        }
        if buf.len() > 512 * 1024 {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "request too large",
            ));
        }
    }
    Ok(buf)
}

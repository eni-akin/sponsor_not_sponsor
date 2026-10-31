const key = 'sns.receipt.v1';
let receipt;
try {
  const stored = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);
  receipt = stored ? JSON.parse(stored) : null;
} catch { receipt = null; }
const heading = document.querySelector('#received-heading');
if (receipt && typeof receipt.reportId === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(receipt.reportId) && Number.isFinite(Date.parse(receipt.receivedAt)) && Math.abs(Date.now() - Date.parse(receipt.receivedAt)) < 15 * 60 * 1000) {
  heading.textContent = 'Report received';
  document.querySelector('#receipt-panel').hidden = false;
  document.querySelector('#receipt-fallback').hidden = true;
  document.querySelector('#receipt').textContent = receipt.reportId;
  document.querySelector('#copy-receipt').onclick = async () => {
    try { await navigator.clipboard.writeText(receipt.reportId); document.querySelector('#copy-status').textContent = 'Receipt copied.'; }
    catch { document.querySelector('#copy-status').textContent = 'Could not copy. Select the receipt above and copy it manually.'; }
  };
}
heading.focus();

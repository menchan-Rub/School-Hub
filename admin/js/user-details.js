async function displayUserHistory(userId) {
  const history = await BrowserHistory.getUserHistory(userId);
  const tbody = document.getElementById('historyTableBody');
  
  tbody.innerHTML = history.map(entry => `
    <tr>
      <td>${new Date(entry.timestamp).toLocaleString()}</td>
      <td>${entry.url}</td>
      <td>${entry.title}</td>
    </tr>
  `).join('');
} 
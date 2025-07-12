const allowedTeams = ['각반', '대림', '장수풍뎅이', '러부엉', '양갱', '블페러', '관전자',];
const teamPasswords = {
  '각반': '1112',
  '대림': '2223',
  '장수풍뎅이': '3334',
  '러부엉': '4445',
  '양갱': '5556',
  '블페러': '6667',
  '관전자': '7778',
};

function getTeamFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get('team');
  return t ? t : null;
}

const myTeam = getTeamFromUrl();

if (!allowedTeams.includes(myTeam)) {
  document.body.innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-size:2rem;color:#f4511e;font-family:'GmarketSansBold',sans-serif;">
      🚫 잘못된 팀명으로 접근하셨습니다.<br><br>
      URL을 확인해주세요.
    </div>
  `;
  throw new Error("Invalid team name");
} else {
  const userPw = prompt(`${myTeam} 비밀번호를 입력하세요`);
  if (userPw !== teamPasswords[myTeam]) {
    document.getElementById('blocker').innerHTML =
      `<div style="color:red;font-size:2rem;">❌ 비밀번호 미입력으로 기능이 작동하지 않습니다.
                                                            새로 고침을 통해 비밀번호를 입력해주세요. </div>`;
    throw new Error("비밀번호 오류");
  }
}

// 권한별 버튼 표시
window.onload = function() {
  if (myTeam !== '관전자') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }
  if (myTeam === '관전자') {
    document.querySelectorAll('.team-only').forEach(el => el.style.display = 'none');
    const normalPickBtn = document.getElementById('normalPickBtn');
    if (normalPickBtn) {
      normalPickBtn.onclick = function() {
        if (isRouletteRunning) return;      // 3초 내 중복 방지
        socket.emit('normalPick');
        isRouletteRunning = true;
        normalPickBtn.disabled = true;       // 버튼도 잠금
      };
    }
  }
};

let pickedPlayers = [];
let failedPlayers = [];
let teamRoster = {};
const socket = io();
let teamNames = [];
let teamPoints = {};
let playerList = [];
let auctionState = {};
let isRouletteRunning = false;

// 버튼 활성화 함수 (전역에서 참조)
let updateConfirmButton = null;

// 최초 데이터 받기
socket.on('init', (data) => {
  teamNames = data.teamNames;
  teamPoints = data.teamPoints;
  playerList = data.playerList;
  auctionState = data.auctionState;
  pickedPlayers = data.pickedPlayers || [];
  teamRoster = data.teamRoster || {};
  failedPlayers = data.failedPlayers || [];
  renderRosterTable();
  renderAll();
});

socket.on('updateRoster', (roster) => {
  teamRoster = roster;
  renderRosterTable();
});

function playBbyong() {
  const audio = document.getElementById('bbyong-sound');
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}
function renderRosterTable() {
  const tbl = document.getElementById('rosterTable');
  if (!tbl) return;
  tbl.innerHTML = teamNames.map(team => {
    const names = (teamRoster[team] || []).map(nick => `<td>${nick}</td>`).join('');
    const remain = `<td class="remain">${teamPoints[team] || 0}p</td>`;
    return `<tr>
      <td class="team-name">${team}</td>
      ${names}
      ${'<td></td>'.repeat(4 - (teamRoster[team]?.length || 0))} 
      ${remain}
    </tr>`;
  }).join('');
}

socket.on('normalPickResult', ({ name, message }) => {
  if (message) {
    alert(message);
    return;
  }
  if (!name) return;
  console.log('Picked player:', name);
  pickedPlayers.push(name);
  auctionState.currentPlayer = name;
  startRouletteAnimation(name);
  renderLeft();
  renderCenter();
});

// 새 유저 동기화
socket.emit('getState');

// 경매 관련 이벤트(모두 한 번만 바인딩)
socket.on('auctionStarted', (state) => {
  auctionState = state;
  renderCenter();
  renderHistory();
  if (updateConfirmButton) updateConfirmButton();
});

socket.on('auctionEnded', (state) => {
  auctionState = state;
  renderCenter();
  renderHistory();
  if (updateConfirmButton) updateConfirmButton();
  if (auctionState.currentTeam) {
    // 낙찰(입찰팀 있음) 시
    playConfirm();
  } else {
    // 유찰(입찰팀 없음) 시
    showBidAlert('유찰되었습니다!', false); // 이 줄로 교체!
  }
});



socket.on('auctionCanceled', (state) => {
  auctionState = state;
  renderCenter();
  renderHistory();
  if (myTeam === '관전자') {
    showBidAlert('유찰되었습니다!', false);
  }
  if (updateConfirmButton) updateConfirmButton();
});


socket.on('timer', (timer) => {
  auctionState.timer = timer;
  document.getElementById('auctionTimer').textContent = timer;
  if (updateConfirmButton) updateConfirmButton();
});

socket.on('newBid', ({team, bid, history}) => {
  auctionState.currentBid = bid;
  auctionState.currentTeam = team;
  auctionState.history = history;
  renderCenter();
  renderHistory();
  playBbyong();
});

socket.on('updatePoints', (points) => {
  teamPoints = points;
  renderRight();
});
socket.on('updateHistory', (fullHistory) => {
  auctionState.fullHistory = fullHistory;
  renderRight();
});
socket.on('updateFailedPlayers', (failedList) => {
  failedPlayers = failedList;
  renderLeft();
});
socket.on('updatePlayers', ({ pickedPlayers: picked, failedPlayers: failed }) => {
  pickedPlayers = picked;
  failedPlayers = failed;
  renderLeft();
});
socket.on('bidResult', ({ success, message }) => {
  showBidAlert(message, success);
  document.getElementById('bidBtn').disabled = false;
});

// 렌더링 함수들
function renderAll() {
  renderLeft();
  renderCenter();
  renderRight();
  renderHistory();
}
function renderLeft() {
  const playerListDiv = document.getElementById('playerList');
  playerListDiv.innerHTML = playerList.map(p => {
    let classes = 'player-list-item';
    if (pickedPlayers.includes(p.name)) classes += ' picked-player';
    else if (failedPlayers.includes(p.name)) classes += ' failed-player';
    return `<div class="${classes}">${p.name} / ${p.tier} / ${p.pos}</div>`;
  }).join('');
}
let rouletteInterval = null;

function startRouletteAnimation(finalPlayerName) {
  const rouletteDiv = document.getElementById('rouletteDisplay');
  if (!rouletteDiv) {
    alert(`룰렛 애니메이션: ${finalPlayerName} 뽑힘!`);
    return;
  }

  const candidates = playerList.filter(p => !pickedPlayers.includes(p.name)).map(p => p.name);
  if (candidates.length === 0) {
    rouletteDiv.textContent = "더 이상 뽑을 선수가 없습니다.";
    return;
  }

  let index = 0;
  const spinDuration = 3000;
  const intervalTime = 100;

  rouletteDiv.textContent = candidates[index];
  rouletteInterval = setInterval(() => {
    index = (index + 1) % candidates.length;
    rouletteDiv.textContent = candidates[index];
  }, intervalTime);

  setTimeout(() => {
    clearInterval(rouletteInterval);
    rouletteDiv.textContent = finalPlayerName;
    renderLeft();
    isRouletteRunning = false; // 3초 뒤 롤렛 중복 방지 해제!
    const normalPickBtn = document.getElementById('normalPickBtn');
    if (normalPickBtn) normalPickBtn.disabled = false; // 버튼도 다시 활성화
  }, spinDuration); // spinDuration = 3000(3초)
}
function playConfirm() {
  const audio = document.getElementById('confirm-sound');
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}

function showBidAlert(message, success = true) {
  const alertDiv = document.getElementById('bidAlert');
  const alertText = document.getElementById('bidAlertText');
  alertText.textContent = message;
  alertDiv.style.background = success ? '#4caf50' : '#f44336';
  alertDiv.style.display = 'block';
  setTimeout(() => {
    alertDiv.style.display = 'none';
  }, 2500);
}

function renderRight() {
  // 사용 안 함
}

function renderCenter() {
  document.getElementById('currentBid').textContent = (auctionState.currentBid || 0) + " P";
  document.getElementById('currentBidTeam').textContent = auctionState.currentTeam || '-';
  document.getElementById('topTeamName').textContent = myTeam;
  let msg = '';
  if (!auctionState.isRunning && auctionState.currentPlayer) msg = '⚠️ 입찰 종료!';
  document.getElementById('auctionStatusMsg').textContent = msg;
}

function renderHistory() {
  const tbody = document.getElementById('historyTable');
  const history = auctionState.isRunning ? auctionState.history : auctionState.fullHistory;
  if (history && history.length > 0) {
    tbody.innerHTML = history.slice().reverse().map(row =>
      `<tr>
        <td>${row.team}</td>
        <td>${row.player || '-'}</td>
        <td>${row.bid}</td>
      </tr>`
    ).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="3">-</td></tr>';
  }
}

// 경매 시작
window.startAuction = () => {
  if (myTeam !== '관전자') return;
  if (!auctionState.currentPlayer) {
    alert('경매를 시작할 선수를 먼저 뽑아주세요.');
    return;
  }
  if (confirm('경매를 시작하겠습니까?')) {
    socket.emit('startAuction', auctionState.currentPlayer);
  }
};

// 입찰
window.bid = () => {
  const team = myTeam;
  const bidBtn = document.getElementById('bidBtn');
  const bid = parseInt(document.getElementById('bidInput').value, 10);
  if (!auctionState.isRunning) {
    alert('경매가 시작되지 않았습니다.');
    return;
  }
  if (!team || isNaN(bid) || bid < 1) return;
  if (bid % 5 !== 0) {
    showBidAlert('입찰은 5포인트 단위로만 가능합니다.', false);
    return;
  }
  bidBtn.disabled = true;
  socket.emit('bid', { team, bid });
  document.getElementById('bidInput').value = '';
};


// 낙찰
window.confirmAuction = () => {
  if (myTeam !== '관전자') return;
  socket.emit('confirmAuction');
};

// DOMContentLoaded에서 버튼·입력 등만 바인딩
document.addEventListener('DOMContentLoaded', () => {
  const confirmButton = document.getElementById('confirmAuctionBtn');
  if (confirmButton) {
    updateConfirmButton = function() {
      const canConfirm = auctionState.isRunning || (!auctionState.isRunning && auctionState.timer === 0);
      confirmButton.disabled = !canConfirm;
    };
    updateConfirmButton();
  }
  const bidInput = document.getElementById('bidInput');
  if (bidInput) {
    bidInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        window.bid();
      }
    });
  }
});

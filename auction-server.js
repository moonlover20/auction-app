// auction-server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const playerImageMap = {
'봉식': 'https://i.imgur.com/jAOM4DY.png',
 '광천김': 'https://i.imgur.com/WtwHTSl.png',
'도민': 'https://i.imgur.com/j2Xh5Y4.png',
 '나무': 'https://i.imgur.com/UxqRCty.png',
'훈상태': 'https://i.imgur.com/LtkorXo.png',
'미주': 'https://i.imgur.com/25NaMwd.png',
'승우': 'https://i.imgur.com/4C3FJR9.png',
'대파': 'https://i.imgur.com/XVm03so.png',
'타포': 'https://i.imgur.com/F0pD7Eu.png',
'노잭': 'https://i.imgur.com/v1AB76A.png',
'바나나': 'https://i.imgur.com/VlvHwEm.png',
'현진': 'https://i.imgur.com/C34RNMz.png',
'박제인간': 'https://i.imgur.com/e0vpsmw.png',
'키죠': 'https://i.imgur.com/oU6CMxm.png',
'러라': 'https://i.imgur.com/97CZj3Y.png',
'까치': 'https://i.imgur.com/bp8R3xi.png',
'재민': 'https://i.imgur.com/9MCbrib.png',
'케케로': 'https://i.imgur.com/2jPJ5iK.png',
'블페러': 'https://i.imgur.com/2uIczlY.png',
'양갱': 'https://i.imgur.com/sOpLidA.png',
'조이': 'https://i.imgur.com/jGz4gfX.png',
'르블이': 'https://i.imgur.com/IeUn4BK.png',
'말대모': 'https://i.imgur.com/fYlj1vU.png',
'장수풍뎅이': 'https://i.imgur.com/pOQBcBM.png',
'케터': 'https://i.imgur.com/qFWJkmr.png',
'러부엉': 'https://i.imgur.com/L3z4Xm4.png',
'대림': 'https://i.imgur.com/EDgw7qa.png',
'각반': 'https://i.imgur.com/zdK62dW.png',
'라포': 'https://i.imgur.com/V6D2A5F.png',
'견습생': 'https://i.imgur.com/EV5W8Aj.png',
 '효택': 'https://i.imgur.com/AxWCpH1.png',
  '제프리': 'https://i.imgur.com/YUqJfvm.png',
  '마로마옹': 'https://i.imgur.com/iOqfBsC.png',
   '고만로': 'https://i.imgur.com/29CT0mf.png',
   '아펠': 'https://i.imgur.com/MWmdso8.png',
   'COZ': 'https://i.imgur.com/leuPJMJ.png',
   '알빠노': 'https://i.imgur.com/KSfj6Hj.png',
   '포베어': 'https://i.imgur.com/xgFs1Vt.png',
   '에스텔': 'https://i.imgur.com/06WN0dI.png',
   '한쥐': 'https://i.imgur.com/puFSrBw.png',
   '미현': 'https://i.imgur.com/C8Tu2Ml.png',
    '로즈': 'https://i.imgur.com/WmBkx9k.jpeg',
     '찐석': 'https://i.imgur.com/t34JF9v.jpeg',
   '김춘식': 'https://i.imgur.com/yEZo2d0.jpeg',
   '오픈더': 'https://i.imgur.com/mSUsARz.png',
       '달좋': 'https://i.imgur.com/gPyCsgL.png',
   '엄소지': 'https://i.imgur.com/9Ih66Dm.png',
   '믜야': 'https://i.imgur.com/2jNNQt1.png',
  '자잘자': 'https://i.imgur.com/dCLeHpC.png',
'숨이다': 'https://i.imgur.com/K4XVcUy.jpeg',
'흑별': 'https://i.imgur.com/sfODJOP.jpeg',
'쿠쿠': 'https://i.imgur.com/3vB3jHn.png',
 '자초봇': 'https://i.imgur.com/IbZK86O.png',
 '소율': 'https://i.imgur.com/JmmwjHN.jpeg',
 '해스크': '',
'성짹짹이': '',
 '빙젭': '',
 '혜철이': '',
 '물결의': '',
 '소실아': '',
 '스카이캐슬': 'https://i.imgur.com/s59phge.png',
 '장잭': '',
 '크립': '',
 '새벽의악마': '',
 '사미언': ''

  
 
};

const teamNames = [ '블페러', '포베어',  '혜철이','박제인간','훈상태','까치' ];
let auctionInterval = null;
let teamPoints = { 블페러: 29000, 혜철이: 32500, 박제인간: 36000, 포베어: 36000, 까치: 37000, 훈상태: 40000};
let pickedPlayers = [];
let failedPlayers = [];
let playerList = [

    { name: '로즈', tier: 'C', pos: '정글' },
     { name: '양갱', tier: 'M', pos: '미드' },
  { name: '견습생', tier: 'M', pos: '정글' },
  { name: '재민', tier: 'M', pos: '탑' },
 { name: '해스크', tier: 'M', pos: '서폿' },
 { name: '빙젭', tier: 'M', pos: '원딜' },
  { name: '케터', tier: 'M', pos: '미드' },
  { name: '성짹짹이', tier: 'M', pos: '미드' },
   { name: '자잘자', tier: 'D', pos: '미드' },
  { name: '물결의', tier: 'D', pos: '탑' },
   { name: '케케로', tier: 'D', pos: '탑' },
  { name: '대파', tier: 'E', pos: '서폿' },
  { name: '사미언', tier: 'E', pos: '정글' },
   { name: '승우', tier: 'E', pos: '원딜' },
   { name: '키죠', tier: 'E', pos: '원딜' },
 { name: '타포', tier: 'E', pos: '원딜' },
 { name: '소실아', tier: 'E', pos: '정글' },
{ name: '알빠노', tier: 'E', pos: '미드' },
  { name: '스카이캐슬', tier: 'E', pos: '서폿' },
  { name: '노잭', tier: 'P', pos: '서폿' },
  { name: '장잭', tier: 'P', pos: '정글' },
    { name: '크립', tier: 'P', pos: '원딜' },
    { name: '새벽의악마', tier: 'P', pos: '미드' },
  { name: '호박고구마', tier: 'G', pos: '서폿' },

];
let teamRoster = {
  블페러: [],
  포베어: [],
  혜철이: [],
 박제인간: [],
  훈상태: [],
  까치: [],
   
};

let auctionState = {
  currentPlayer: null,      // 뽑힌 플레이어 닉네임
  currentBid: 0,
  currentTeam: null,
  timer: 30,
  isRunning: false,
  history: [],
  fullHistory: [],          // 전체 입찰 이력 (표용)
};

// 정적 파일 서비스
app.use(express.static('public'));

// 실시간 통신
io.on('connection', (socket) => {
  // 최초 접속시 전체 데이터 전달
  socket.emit('init', {
    teamNames,
    teamPoints,
    playerList,
    auctionState,
    pickedPlayers,
    failedPlayers,
 playerImageMap, 
   teamRoster,
  });
  socket.on('setPlayerStatus', ({ name, status }) => {
    // 1. 이름이 있으면 picked, failed 모두에서 제거
    pickedPlayers = pickedPlayers.filter(n => n !== name);
    failedPlayers = failedPlayers.filter(n => n !== name);

    // 2. 상태에 따라 배열에 넣기
    if (status === 'picked') pickedPlayers.push(name);
    else if (status === 'failed') failedPlayers.push(name);
    // (status가 'default'면 어디에도 안넣음 = 검은색)

    // 모든 클라이언트에게 최신 상태 전송
    io.emit('updatePlayers', { pickedPlayers, failedPlayers });
  });
  socket.on('clearHistory', () => {
    // 관리자 인증 있으면 여기서 확인 가능
    auctionState.fullHistory = [];
    auctionState.history = [];
    io.emit('updateHistory', auctionState.fullHistory);
  });
  socket.on('chatMessage', ({ team, name, message }) => {
    // 모든 클라이언트에 브로드캐스트 (팀명, 메시지, 타임스탬프 포함)
    io.emit('chatMessage', {
      team,
      name,
      message,
      timestamp: Date.now(),
    });
  });
socket.on('setTeamPoints', ({ team, point }) => {
  if (!teamNames.includes(team)) return;
  if (typeof point !== "number" || point < 0) return;
  teamPoints[team] = point;
  io.emit('updatePoints', teamPoints);
});
  // 새 유저에게 전체 실시간 상태 전송
  socket.on('getState', () => {
    socket.emit('init', {
      teamNames,
      teamPoints,
      playerList,
      auctionState,
      pickedPlayers,
      failedPlayers,
 playerImageMap,
     teamRoster
    });
  });

  // 일반 뽑기
  socket.on('normalPick', () => {
    // 뽑히지 않고 실패하지 않은 선수 목록 필터링
    const availablePlayers = playerList.filter(p => 
      !pickedPlayers.includes(p.name) && !failedPlayers.includes(p.name)
    );

    if (availablePlayers.length === 0) {
      // 더 뽑을 선수 없음
      socket.emit('normalPickResult', { name: null, message: '더 이상 뽑을 선수가 없습니다.' });
      return;
    }

    // 랜덤으로 한 명 뽑기
    const picked = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

    // 뽑힌 선수 이름 클라이언트에 전달
io.emit('normalPickResult', {
  name: picked.name,
  image: playerImageMap[picked.name] || null,
});
});

  // 경매 시작 (관리자만)
// startAuction 이벤트
socket.on('startAuction', (playerName) => {
  if (auctionState.isRunning) return;
  if (!playerName) {
    socket.emit('error', '경매 시작할 선수가 지정되어 있지 않습니다.');
    return;
  }
  auctionState.currentPlayer = playerName;
  auctionState.currentBid = 0;
  auctionState.currentTeam = null;
  auctionState.timer = 20;
  auctionState.isRunning = true;
  auctionState.history = [];
  io.emit('auctionStarted', { ...auctionState });

  if (auctionInterval) clearInterval(auctionInterval);

  auctionInterval = setInterval(() => {
    auctionState.timer--;
    io.emit('timer', auctionState.timer);

if (auctionState.timer <= 0 || !auctionState.isRunning) {
  clearInterval(auctionInterval);
  auctionState.isRunning = false;

  if (auctionState.currentBid > 0 && auctionState.currentTeam) {
    // 자동 낙찰 처리
    teamPoints[auctionState.currentTeam] -= auctionState.currentBid;
    
    // 👇 [추가!] 팀원 목록에 자동 추가 (최대 4명까지)
    if (!teamRoster[auctionState.currentTeam].includes(auctionState.currentPlayer) && teamRoster[auctionState.currentTeam].length < 4) {
      teamRoster[auctionState.currentTeam].push(auctionState.currentPlayer);
    }
    // 👆

    auctionState.fullHistory.push({
      team: auctionState.currentTeam,
      player: auctionState.currentPlayer,
      bid: auctionState.currentBid,
    });

    io.emit('updatePoints', teamPoints);
    io.emit('updateRoster', teamRoster); // 👈 [추가] 표 갱신용
  } else {
    // 자동 유찰 처리
    pickedPlayers = pickedPlayers.filter(n => n !== auctionState.currentPlayer);  // 뽑힘 목록에서 제거
    if (!failedPlayers.includes(auctionState.currentPlayer)) {
      failedPlayers.push(auctionState.currentPlayer);
    }
    io.emit('updatePlayers', { pickedPlayers, failedPlayers });
  }

  io.emit('auctionEnded', { ...auctionState, history: auctionState.fullHistory });
  io.emit('updateHistory', auctionState.fullHistory);
}

  }, 1000);
});

// bid 이벤트
socket.on('bid', ({ team, bid }) => {
  if (!auctionState.isRunning) {
    socket.emit('bidResult', { success: false, message: '경매가 시작되지 않았습니다.' });
    return;
  }
  if (!teamNames.includes(team)) {
    socket.emit('bidResult', { success: false, message: '유효하지 않은 팀입니다.' });
    return;
  }

  // 500포인트 단위로만 입찰 허용!
  if (bid % 500 !== 0) {
    socket.emit('bidResult', { success: false, message: '입찰은 500포인트 단위로만 가능합니다.' });
    return;
  }
  if (bid > auctionState.currentBid && bid <= teamPoints[team]) {
    auctionState.currentBid = bid;
    auctionState.currentTeam = team;
    auctionState.history.push({ team, player: auctionState.currentPlayer, bid });  // ← player 정보도 함께

    // 타이머를 초기화만 함(20초로)
    auctionState.timer = 20;
    io.emit('timer', auctionState.timer);

    // **여기서 setInterval 다시 생성하지 말 것**

    io.emit('newBid', { team, bid, history: auctionState.history });
    socket.emit('bidResult', { success: true, message: '입찰에 성공했습니다!' });
  } else {
    socket.emit('bidResult', { success: false, message: '입찰가가 현재 입찰가보다 낮거나 잔여 포인트가 부족합니다.' });
  }
});
// 팀별 선수 제거 (관리자)
socket.on('removePlayerFromTeam', ({ team, name }) => {
  if (!teamRoster[team]) return;
  teamRoster[team] = teamRoster[team].filter(nick => nick !== name);
  io.emit('updateRoster', teamRoster);
});



  // 낙찰 (관리자만)
socket.on('confirmAuction', () => {
  if (!auctionState.isRunning) return;
  if (auctionState.currentTeam && auctionState.currentBid > 0) {
    // 팀 포인트 차감
    teamPoints[auctionState.currentTeam] -= auctionState.currentBid;
    // [추가!] 닉네임 팀 목록에 추가
    if (!teamRoster[auctionState.currentTeam].includes(auctionState.currentPlayer)) {
      teamRoster[auctionState.currentTeam].push(auctionState.currentPlayer);
    }
    auctionState.fullHistory.push({
      team: auctionState.currentTeam,
      player: auctionState.currentPlayer,
      bid: auctionState.currentBid
    });
  }
  auctionState.isRunning = false;
  io.emit('auctionEnded', { ...auctionState });
  io.emit('updatePoints', teamPoints);
  io.emit('updateHistory', auctionState.fullHistory);
  io.emit('updateRoster', teamRoster); // 추가! 클라이언트에 roster 보내기
});




});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버 실행중: http://localhost:${PORT}`);
});

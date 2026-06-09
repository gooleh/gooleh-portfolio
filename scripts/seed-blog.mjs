#!/usr/bin/env node
/**
 * 블로그 DB 정리/시딩 1회성 스크립트 (재실행 안전):
 *  1. Slug(rich_text) 컬럼 추가
 *  2. 비공개 프로젝트(안드로이드 채팅앱) 관련 글 3개 unpublish
 *  3. 기존 글 11개에 slug 부여 + 본문 보강 (이미 보강된 글은 건너뜀)
 *  4. 신규 글 3개 생성 (포트폴리오 / 블루하우징 / 아두이노)
 *
 * Usage: node scripts/seed-blog.mjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Client } from '@notionhq/client';

const ROOT = resolve(import.meta.dirname, '..');
for (const line of readFileSync(resolve(ROOT, '.env.local'), 'utf-8').split('\n')) {
  const eq = line.indexOf('=');
  if (eq === -1) continue;
  const key = line.slice(0, eq).trim();
  const val = line.slice(eq + 1).trim();
  if (key && !process.env[key]) process.env[key] = val;
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DB = process.env.NOTION_BLOG_DB_ID;

// ── 블록 빌더 헬퍼 ──────────────────────────────────────────
const h2 = (text) => ({ heading_2: { rich_text: [{ text: { content: text } }] } });
const p = (text) => ({ paragraph: { rich_text: [{ text: { content: text } }] } });
const code = (content, language) => ({ code: { rich_text: [{ text: { content } }], language } });

// ── 기존 글 보강 데이터 (제목으로 매칭) ──────────────────────
const ENRICH = {
  'Swift와 SwiftUI를 활용한 호텔 관리 앱 개발 시작하기': {
    slug: 'swift-hotel-app-1-setup',
    blocks: [
      h2('왜 SwiftUI였나'),
      p('호텔 현장에서 일하면서 프런트데스크와 하우스키핑 간의 소통이 무전기와 종이 메모에 의존하는 걸 보고, 객실 상태를 실시간으로 공유하는 앱을 직접 만들어보기로 했습니다. UIKit 대신 SwiftUI를 선택한 이유는 선언형 문법 덕분에 화면 상태와 데이터를 자연스럽게 동기화할 수 있고, 프리뷰로 UI를 빠르게 반복 수정할 수 있기 때문이었습니다.'),
      h2('프로젝트 구조 잡기'),
      p('MVVM 패턴을 기본으로 View / ViewModel / Model / Service 네 개 레이어로 나눴습니다. Firebase 연동 코드는 전부 Service 레이어에 격리해서, 나중에 백엔드를 바꾸더라도 ViewModel 위쪽은 손대지 않아도 되도록 설계했습니다.'),
      code(`struct Room: Identifiable, Codable {
    @DocumentID var id: String?
    var number: Int
    var status: RoomStatus   // .vacant, .occupied, .cleaning
    var guestName: String?
    var updatedAt: Date
}

enum RoomStatus: String, Codable {
    case vacant, occupied, cleaning
}`, 'swift'),
      h2('첫 화면까지'),
      p('Room 모델 하나와 객실 목록 화면을 만드는 것으로 시작했습니다. 처음부터 완벽한 구조를 만들기보다, 동작하는 최소 단위를 만들고 매 편마다 기능을 붙여가는 방식으로 진행합니다. 다음 편에서는 Firestore와 ViewModel을 연결해 실제 데이터가 흐르게 만듭니다.'),
    ],
  },
  'FireStore와 RoomViewModel을 이용한 데이터 관리': {
    slug: 'swift-hotel-app-2-firestore-viewmodel',
    blocks: [
      h2('Firestore 실시간 리스너 연결'),
      p('객실 상태는 여러 직원이 동시에 바꾸는 데이터라서 단순 fetch로는 부족했습니다. Firestore의 addSnapshotListener를 사용하면 컬렉션이 바뀔 때마다 콜백이 호출되므로, 이걸 ViewModel의 @Published 프로퍼티에 연결해 화면이 자동 갱신되게 했습니다.'),
      code(`@MainActor
final class RoomViewModel: ObservableObject {
    @Published var rooms: [Room] = []
    private var listener: ListenerRegistration?

    func subscribe() {
        listener = Firestore.firestore().collection("rooms")
            .order(by: "number")
            .addSnapshotListener { [weak self] snapshot, _ in
                self?.rooms = snapshot?.documents
                    .compactMap { try? $0.data(as: Room.self) } ?? []
            }
    }

    deinit { listener?.remove() }
}`, 'swift'),
      h2('리스너 생명주기 관리'),
      p('처음에는 화면을 오갈 때마다 리스너가 중복 등록되어 같은 업데이트가 여러 번 반영되는 버그가 있었습니다. subscribe를 onAppear가 아닌 ViewModel 생성 시점에 한 번만 호출하고, deinit에서 반드시 remove하는 것으로 해결했습니다. 실시간 리스너는 등록한 만큼 과금되기도 하므로 생명주기 관리가 곧 비용 관리이기도 합니다.'),
      h2('낙관적 업데이트'),
      p('객실 상태 변경 버튼을 누르면 서버 응답을 기다리지 않고 로컬 상태를 먼저 바꾸고, 실패 시 롤백하는 낙관적 업데이트를 적용했습니다. 호텔 현장에서는 네트워크가 불안정한 구역이 있어서 체감 반응 속도가 중요했기 때문입니다.'),
    ],
  },
  'SwiftUI로 직관적인 사용자 인터페이스 설계하기': {
    slug: 'swift-hotel-app-3-ui-design',
    blocks: [
      h2('현장에서 출발한 디자인'),
      p('이 앱의 사용자는 디자이너가 아니라 유니폼 주머니에서 폰을 꺼내 3초 안에 객실 상태를 확인해야 하는 직원입니다. 그래서 화면당 정보는 최소화하고, 객실 상태를 색상만으로 구분할 수 있게 했습니다 — 빈 방은 초록, 투숙 중은 파랑, 청소 중은 주황. 멀리서 봐도 층 전체 상황이 한눈에 들어옵니다.'),
      h2('컴포넌트 분리'),
      p('FrontDeskView는 객실 그리드를, RoomDetailView는 개별 객실의 상세 정보와 상태 변경 버튼을 담당합니다. 상태 칩, 객실 카드 같은 반복 요소는 커스텀 뷰로 분리해 재사용했습니다.'),
      code(`struct RoomCard: View {
    let room: Room

    var body: some View {
        VStack(spacing: 4) {
            Text("\\(room.number)")
                .font(.headline)
            Circle()
                .fill(room.status.color)
                .frame(width: 10, height: 10)
        }
        .padding(8)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}`, 'swift'),
      h2('배운 점'),
      p('UI/UX는 예쁘게 만드는 일이 아니라 사용자의 동선을 줄이는 일이라는 걸 체감했습니다. 실제 직원처럼 시나리오를 돌려보며 탭 수를 세어보니, 처음 설계에서는 상태 변경까지 4번의 탭이 필요했는데 최종적으로 2번까지 줄일 수 있었습니다.'),
    ],
  },
  'PhoneNumberLoginView로 Firebase Authentication 구현하기': {
    slug: 'swift-hotel-app-4-phone-auth',
    blocks: [
      h2('왜 전화번호 인증인가'),
      p('호텔 직원들이 업무용 계정 비밀번호를 자주 잊어버리는 문제가 있었습니다. 전화번호 + SMS 인증 코드 방식은 비밀번호가 아예 없으므로 분실 문제가 원천적으로 사라지고, 직원 개인 폰 번호로 누가 언제 상태를 바꿨는지 추적도 가능해집니다.'),
      h2('Firebase Phone Auth 연동'),
      code(`func sendCode(to phoneNumber: String) async throws {
    let verificationID = try await PhoneAuthProvider.provider()
        .verifyPhoneNumber(phoneNumber, uiDelegate: nil)
    UserDefaults.standard.set(verificationID, forKey: "authVerificationID")
}

func verify(code: String) async throws {
    guard let id = UserDefaults.standard.string(forKey: "authVerificationID") else { return }
    let credential = PhoneAuthProvider.provider()
        .credential(withVerificationID: id, verificationCode: code)
    try await Auth.auth().signIn(with: credential)
}`, 'swift'),
      h2('막혔던 부분'),
      p('시뮬레이터에서는 SMS가 오지 않아 한참 헤맸는데, Firebase 콘솔의 테스트 전화번호 기능으로 해결했습니다. 또 한국 번호는 +82 국가 코드 형식으로 변환해야 해서 입력 단계에서 자동 포매팅을 넣었습니다. 인증 상태에 따라 루트 뷰를 전환하는 로직은 Auth.auth().addStateDidChangeListener를 @Published로 감싸 처리했습니다.'),
    ],
  },
  'RoomServiceRequestView로 호텔 서비스 관리 자동화': {
    slug: 'swift-hotel-app-5-room-service',
    blocks: [
      h2('룸서비스 흐름 설계'),
      p('투숙객 요청이 프런트를 거쳐 주방으로 전달되는 기존 흐름은 전화 두 번과 메모 한 장이 필요했습니다. 앱에서는 요청 생성 → Firestore 저장 → 주방 디바이스 실시간 알림 → 완료 처리까지를 하나의 데이터 흐름으로 만들었습니다.'),
      code(`struct ServiceRequest: Identifiable, Codable {
    @DocumentID var id: String?
    var roomNumber: Int
    var items: [String]
    var status: RequestStatus  // .pending → .inProgress → .done
    var createdAt: Date
}`, 'swift'),
      h2('Socket 통신과 Firestore의 역할 분담'),
      p('주문 데이터의 영속화는 Firestore가, 주방 디스플레이의 즉각적인 알림은 Socket.IO가 담당하도록 역할을 나눴습니다. 처음엔 Firestore 리스너만으로 충분할 거라 생각했지만, 주방처럼 알림 지연이 1~2초만 생겨도 체감되는 환경에서는 소켓의 즉시성이 필요했습니다.'),
      h2('시리즈를 마치며'),
      p('5편에 걸쳐 객실 관리부터 룸서비스 자동화까지 만들었습니다. 호텔리어로 일한 경험이 요구사항 정의에 그대로 쓰였다는 점에서, 도메인 지식이 있는 분야의 앱을 만드는 것이 학습 효율이 가장 좋다는 걸 배웠습니다.'),
    ],
  },
  'Flutter와 Web3Dart를 활용한 블록체인 앱 개발': {
    slug: 'flutter-blockchain-1-web3dart',
    blocks: [
      h2('프로젝트 목표'),
      p('일반 가계부는 기록을 수정해도 흔적이 남지 않습니다. 고액 거래만큼은 블록체인에 기록해서 위변조가 불가능한 장부를 만들어보자는 아이디어로 시작했습니다. Flutter를 선택한 건 모바일 크로스플랫폼 지원과 함께, web3dart라는 성숙한 이더리움 라이브러리가 있었기 때문입니다.'),
      h2('Web3Dart로 이더리움 연결'),
      code(`final client = Web3Client(rpcUrl, Client());

Future<EtherAmount> getBalance(String address) async {
  return client.getBalance(EthereumAddress.fromHex(address));
}

Future<String> sendTransaction(Credentials creds, Transaction tx) async {
  return client.sendTransaction(creds, tx, chainId: 11155111); // Sepolia
}`, 'dart'),
      h2('테스트넷에서 시작하기'),
      p('개발 단계에서는 실제 ETH를 쓸 수 없으므로 Sepolia 테스트넷을 사용했습니다. Faucet에서 테스트 ETH를 받고, Infura RPC 엔드포인트로 연결하는 환경 구성이 첫 관문이었습니다. 트랜잭션 하나가 채굴되어 확정되기까지의 비동기 흐름을 다루는 것이 일반 REST API 호출과 가장 다른 점이었습니다.'),
    ],
  },
  'IPFS와 Pinata를 활용한 데이터 저장': {
    slug: 'flutter-blockchain-2-ipfs-pinata',
    blocks: [
      h2('온체인에 다 넣을 수 없는 이유'),
      p('블록체인에 데이터를 저장하는 비용은 바이트 단위로 과금됩니다. 거래 메모, 영수증 이미지 같은 큰 데이터를 온체인에 넣으면 트랜잭션 하나에 수천 원의 가스비가 나올 수 있습니다. 그래서 실제 데이터는 IPFS에 올리고, 블록체인에는 그 콘텐츠 해시(CID)만 기록하는 표준 패턴을 적용했습니다.'),
      h2('Pinata로 피닝하기'),
      p('IPFS는 아무도 피닝하지 않은 데이터를 가비지 컬렉션으로 지울 수 있습니다. Pinata는 데이터를 항상 피닝해주는 서비스로, REST API로 JSON을 업로드하면 CID를 돌려줍니다.'),
      code(`Future<String> uploadToPinata(Map<String, dynamic> json) async {
  final res = await http.post(
    Uri.parse('https://api.pinata.cloud/pinning/pinJSONToIPFS'),
    headers: {
      'Authorization': 'Bearer \$pinataJwt',
      'Content-Type': 'application/json',
    },
    body: jsonEncode(json),
  );
  return jsonDecode(res.body)['IpfsHash']; // CID
}`, 'dart'),
      h2('무결성 검증'),
      p('CID는 콘텐츠의 해시이므로, 나중에 IPFS에서 데이터를 다시 받아 해시를 비교하면 위변조 여부를 검증할 수 있습니다. "원본은 IPFS, 증명은 체인"이라는 구조 덕분에 가스비를 아끼면서도 무결성은 유지할 수 있었습니다.'),
    ],
  },
  'MetaMask와 WalletConnect를 이용한 지갑 통합': {
    slug: 'flutter-blockchain-3-metamask-walletconnect',
    blocks: [
      h2('모바일에서 지갑 연동의 어려움'),
      p('웹에서는 MetaMask 브라우저 확장이 window.ethereum을 주입해주지만, 모바일 앱에는 그런 게 없습니다. WalletConnect 프로토콜을 사용하면 앱과 MetaMask 모바일 앱이 딥링크와 릴레이 서버를 통해 세션을 맺고, 서명 요청을 주고받을 수 있습니다.'),
      h2('세션 연결 흐름'),
      code(`final connector = WalletConnect(
  bridge: 'https://bridge.walletconnect.org',
  clientMeta: const PeerMeta(
    name: '블록체인 가계부',
    url: 'https://example.com',
  ),
);

Future<void> connect() async {
  final session = await connector.createSession(
    onDisplayUri: (uri) => launchUrl(Uri.parse('metamask://wc?uri=\$uri')),
  );
  print('연결된 주소: \${session.accounts.first}');
}`, 'dart'),
      h2('UX에서 신경 쓴 부분'),
      p('서명 요청마다 MetaMask 앱으로 전환됐다가 돌아오는 흐름이 사용자에게 혼란스러울 수 있어서, 전환 전에 "MetaMask에서 서명을 확인해주세요" 안내 화면을 넣었습니다. 또 세션이 만료된 상태에서 트랜잭션을 시도하면 조용히 실패하는 문제가 있어 세션 유효성을 먼저 확인하는 가드를 추가했습니다.'),
    ],
  },
  '블록체인 데이터 필터링 및 트랜잭션 배치 처리': {
    slug: 'flutter-blockchain-4-batch-processing',
    blocks: [
      h2('문제: 거래 하나당 트랜잭션 하나'),
      p('처음 구현은 가계부 항목 하나를 저장할 때마다 트랜잭션을 하나씩 보냈습니다. 거래가 많은 날에는 가스비가 데이터 가치보다 커지는 본말전도가 일어났습니다. 해결 방향은 두 가지 — 기록할 가치가 있는 데이터만 필터링하고, 여러 건을 묶어서 한 번에 보내는 것이었습니다.'),
      h2('필터링 + 배치 큐'),
      code(`class TxBatchQueue {
  final List<Map<String, dynamic>> _pending = [];
  static const threshold = 500000; // 50만원 이상만 온체인 기록

  void add(Map<String, dynamic> entry) {
    if ((entry['amount'] as int) >= threshold) _pending.add(entry);
  }

  Future<void> flush() async {
    if (_pending.isEmpty) return;
    final cid = await uploadToPinata({'entries': _pending});
    await contract.recordBatch(cid, _pending.length);
    _pending.clear();
  }
}`, 'dart'),
      h2('결과'),
      p('하루 거래를 모아 자정에 한 번 flush하는 방식으로 바꾼 뒤, 트랜잭션 수가 평균 1/8로 줄었습니다. 배치로 묶인 데이터는 IPFS에 통째로 올라가고 체인에는 CID 하나만 기록되므로 가스비 절감 효과가 컸습니다.'),
    ],
  },
  'BlockchainTransactionProvider로 상태 관리 구현': {
    slug: 'flutter-blockchain-5-provider-state',
    blocks: [
      h2('블록체인 앱의 상태는 왜 까다로운가'),
      p('일반 앱의 API 호출은 성공/실패 두 가지 상태면 충분하지만, 블록체인 트랜잭션은 서명 대기 → 전송됨 → 채굴 대기 → 확정 → (가끔) 재구성으로 되돌아감까지 상태가 많고 각 단계가 수 초에서 수 분까지 걸립니다. 이 상태를 화면에 정직하게 보여주지 않으면 사용자는 "앱이 멈췄나?"라고 느낍니다.'),
      h2('Provider 패턴 적용'),
      code(`enum TxStatus { idle, signing, pending, confirmed, failed }

class BlockchainTransactionProvider extends ChangeNotifier {
  TxStatus _status = TxStatus.idle;
  TxStatus get status => _status;

  Future<void> send(Transaction tx) async {
    _update(TxStatus.signing);
    try {
      final hash = await wallet.sendTransaction(tx);
      _update(TxStatus.pending);
      await client.waitForReceipt(hash);
      _update(TxStatus.confirmed);
    } catch (_) {
      _update(TxStatus.failed);
    }
  }

  void _update(TxStatus s) { _status = s; notifyListeners(); }
}`, 'dart'),
      h2('화면과의 연결'),
      p('Consumer로 status를 구독해 단계별 프로그레스 UI를 보여줬습니다. 특히 pending 상태에서는 예상 대기 시간과 함께 "지금 닫아도 트랜잭션은 계속 진행됩니다"라는 안내를 넣어, 사용자가 앱을 종료해도 불안하지 않게 했습니다.'),
    ],
  },
  'IPFS와 배치 트랜잭션을 통한 가스비 절감 전략': {
    slug: 'flutter-blockchain-6-gas-optimization',
    blocks: [
      h2('시리즈 마지막 편: 비용 최적화 총정리'),
      p('앞선 편들에서 적용한 기법들이 실제로 가스비를 얼마나 줄였는지 측정하고 정리했습니다. 핵심 원칙은 하나입니다 — 체인에는 최소한의 증명만 남기고, 무거운 데이터는 전부 밖으로.'),
      h2('적용한 전략들'),
      p('1) 대용량 데이터는 IPFS에 저장하고 CID만 온체인 기록, 2) 거래를 모아 배치로 처리해 트랜잭션 수 자체를 감소, 3) 스마트 컨트랙트에서 storage 변수 대신 event log 활용 (event는 storage 쓰기보다 훨씬 저렴), 4) 가스 가격이 낮은 시간대에 배치를 flush하도록 스케줄링.'),
      code(`// storage 쓰기 대신 event로 기록 — 가스비 대폭 절감
contract LedgerAnchor {
    event BatchRecorded(string cid, uint256 count, uint256 timestamp);

    function recordBatch(string calldata cid, uint256 count) external {
        emit BatchRecorded(cid, count, block.timestamp);
    }
}`, 'solidity'),
      h2('측정 결과와 회고'),
      p('최적화 전후로 같은 한 달치 가계부 데이터를 기록하는 비용을 비교하니 약 85% 절감됐습니다. 블록체인 개발에서 아키텍처 설계가 곧 비용 설계라는 것, 그리고 "모든 걸 체인에 올리지 않는 것"이 가장 중요한 최적화라는 걸 배운 프로젝트였습니다.'),
    ],
  },
};

// ── 비공개 프로젝트 관련 글 (unpublish 대상) ─────────────────
const UNPUBLISH = [
  'RecyclerView로 교수 정보 리스트 구현',
  'Firebase Firestore로 실시간 채팅 구현',
  'Android Studio로 캡차 구현하기',
];

// ── 신규 포스트 ──────────────────────────────────────────────
const NEW_POSTS = [
  {
    title: 'Astro 5와 Notion API로 이 포트폴리오 사이트 만들기',
    slug: 'building-this-portfolio',
    description: 'Astro 5, Svelte 5, Three.js로 만든 이 포트폴리오 사이트의 구조와, Notion을 CMS로 쓰는 빌드 타임 데이터 파이프라인을 소개합니다.',
    date: '2026-06-02',
    category: '웹 개발',
    tags: ['Astro', 'Svelte', 'Notion API'],
    readTime: 6,
    blocks: [
      p('지금 보고 계신 이 사이트가 어떻게 만들어졌는지 정리해봤습니다. 핵심 키워드는 세 가지 — 정적 빌드, Notion CMS, 그리고 인터랙티브 3D입니다.'),
      h2('기술 스택 선택'),
      p('프레임워크는 Astro 5를 선택했습니다. 콘텐츠 중심 사이트에서 기본 JS를 0에 가깝게 유지하면서, 인터랙티브한 부분만 Svelte 컴포넌트 아일랜드로 하이드레이션할 수 있다는 점이 결정적이었습니다. 히어로 섹션의 행성은 Three.js를 Svelte에서 선언적으로 다룰 수 있는 Threlte로 만들었습니다.'),
      h2('Notion을 CMS로'),
      p('프로젝트와 블로그 글을 코드 수정 없이 관리하고 싶어서 Notion DB를 콘텐츠 소스로 사용합니다. 빌드 시점에 Notion API로 데이터를 fetch해서 정적 페이지를 생성하므로, 런타임에는 API 호출이 전혀 없습니다. 글을 쓰거나 프로젝트를 추가할 때는 Notion에서 작성하고 재배포만 하면 됩니다.'),
      code(`const { results } = await notion.databases.query({
  database_id: dbId,
  filter: { property: 'Published', checkbox: { equals: true } },
  sorts: [{ property: 'Date', direction: 'descending' }],
});`, 'typescript'),
      h2('디테일들'),
      p('Lenis 스무스 스크롤, Astro View Transitions, 프로젝트 카드 3D 틸트와 hover 영상 재생 같은 인터랙션을 넣되, prefers-reduced-motion 설정 시 전부 비활성화되도록 했습니다. 화려함과 접근성은 트레이드오프가 아니라 분기 처리의 문제라고 생각합니다.'),
      h2('회고'),
      p('원작자(flo-bit)의 허락을 받아 오픈소스 템플릿에서 출발했지만, Notion 연동 프로젝트 시스템과 블로그, 카드 인터랙션 등을 직접 설계하면서 Astro의 아일랜드 아키텍처와 빌드 타임 데이터 파이프라인을 깊이 이해하게 됐습니다. 템플릿을 베끼는 것과 구조를 이해하고 확장하는 것은 완전히 다른 경험이었습니다.'),
    ],
  },
  {
    title: 'React 19로 인테리어 기업 웹사이트 구축기 — 블루하우징',
    slug: 'bluehousing-website',
    description: '실제 운영 중인 인테리어 기업의 공식 웹사이트를 React 19로 구축하며 겪은 것들 — 네이버 블로그 RSS 동기화, GitHub Pages SPA 라우팅, EmailJS 견적 폼.',
    date: '2026-06-09',
    category: '웹 개발',
    tags: ['React', 'Tailwind CSS', 'EmailJS'],
    readTime: 7,
    blocks: [
      p('실제 영업 중인 인테리어 전문기업 블루하우징의 공식 웹사이트를 만들었습니다. 사이드 프로젝트가 아니라 실사용자가 있는 사이트라서, 기술 선택보다 운영 비용과 콘텐츠 신선도가 더 중요한 프로젝트였습니다.'),
      h2('요구사항: 서버 없이 최신 콘텐츠'),
      p('사장님이 시공 사례를 네이버 블로그에 올리시는데, 그 글이 웹사이트에도 자동으로 나오길 원하셨습니다. 서버를 운영하면 비용이 들기 때문에, 빌드 시점에 네이버 블로그 RSS를 파싱해 정적 파일로 굽는 방식을 선택했습니다. npm의 prebuild 훅에 fetch 스크립트를 연결해서 빌드할 때마다 최신 글이 반영됩니다.'),
      code(`// package.json
"scripts": {
  "fetch-blog": "node scripts/fetch-naver-blog.js",
  "prebuild": "npm run fetch-blog",
  "build": "react-scripts build",
  "postbuild": "node scripts/postbuild.js"
}`, 'json'),
      h2('GitHub Pages에서 SPA 라우팅'),
      p('React Router로 만든 SPA를 GitHub Pages에 올리면 /services 같은 경로에서 새로고침 시 404가 납니다. GitHub Pages는 서버 사이드 라우팅이 없기 때문입니다. postbuild 스크립트에서 index.html을 404.html로 복사하는 고전적인 우회법으로 해결했습니다 — 404 페이지가 곧 앱 진입점이 되는 트릭입니다.'),
      h2('견적 문의 폼'),
      p('백엔드 없이 이메일을 보내야 해서 EmailJS를 사용했습니다. 폼 제출 시 클라이언트에서 직접 이메일이 발송되고, 스팸 방지를 위해 전송 빈도 제한을 걸었습니다. 운영 6개월간 실제 견적 문의가 이 폼으로 꾸준히 들어오고 있습니다.'),
      h2('배운 점'),
      p('실제 고객이 있는 사이트는 Lighthouse 점수보다 "사장님이 직접 콘텐츠를 관리할 수 있는가"가 더 중요했습니다. 개발자가 개입하지 않아도 돌아가는 파이프라인을 만드는 것 — 그게 이 프로젝트에서 배운 가장 큰 교훈입니다.'),
    ],
  },
  {
    title: '아두이노 센서 데이터로 카페 혼잡도 실시간 모니터링하기',
    slug: 'arduino-cafe-occupancy',
    description: '아두이노 압력 센서와 카메라로 카페 좌석 점유를 감지하고, Firebase를 거쳐 웹에서 실시간 혼잡도를 보여주는 팀 프로젝트 개발기.',
    date: '2024-12-10',
    category: 'IoT',
    tags: ['Arduino', 'Firebase', 'IoT'],
    readTime: 6,
    blocks: [
      p('"지금 카페에 자리가 있을까?"를 가기 전에 알 수 있다면 어떨까요. 팀 프로젝트로 아두이노 센서와 웹을 연결해 카페 혼잡도를 실시간으로 보여주는 시스템을 만들었습니다.'),
      h2('하드웨어 구성'),
      p('좌석 점유 감지는 의자에 부착한 압력 센서가, 입구 쪽 인원 흐름은 카메라 모듈이 담당했습니다. 아두이노가 센서 값을 읽어 일정 주기로 시리얼 통신을 통해 게이트웨이 역할의 노트북으로 보내고, 노트북의 Node 스크립트가 Firebase Firestore에 업로드하는 구조입니다.'),
      code(`const int PRESSURE_PIN = A0;
const int THRESHOLD = 300;

void loop() {
  int value = analogRead(PRESSURE_PIN);
  bool occupied = value > THRESHOLD;
  Serial.print("{\\"seat\\":1,\\"occupied\\":");
  Serial.print(occupied ? "true" : "false");
  Serial.println("}");
  delay(5000);
}`, 'c'),
      h2('센서 노이즈와의 싸움'),
      p('압력 센서는 사람이 앉지 않아도 가방이나 진동에 반응했습니다. 단순 임계값 비교 대신 최근 N회 측정의 이동 평균을 쓰고, 상태 변경에 최소 지속 시간 조건을 걸어 채터링을 잡았습니다. 하드웨어 프로젝트에서는 코드보다 현실 세계의 노이즈가 더 어려운 문제라는 걸 배웠습니다.'),
      h2('웹 대시보드'),
      p('Firestore의 실시간 리스너를 활용해, 센서 값이 바뀌면 웹 페이지의 좌석 맵이 새로고침 없이 즉시 갱신됩니다. 혼잡도는 점유 좌석 비율에 따라 여유/보통/혼잡 3단계 색상으로 표시했습니다.'),
      h2('팀 프로젝트로서의 회고'),
      p('하드웨어 담당, 게이트웨이 담당, 웹 담당으로 역할을 나눴는데, 인터페이스(시리얼 JSON 포맷, Firestore 스키마)를 먼저 합의하고 시작한 덕분에 병렬 작업이 가능했습니다. 통합 테스트 날 처음으로 센서→웹까지 데이터가 흐르던 순간이 가장 기억에 남습니다.'),
    ],
  },
];

// ── 실행 ─────────────────────────────────────────────────────
async function main() {
  // 1. Slug 컬럼 추가
  const db = await notion.databases.retrieve({ database_id: DB });
  if (!db.properties.Slug) {
    await notion.databases.update({
      database_id: DB,
      properties: { Slug: { rich_text: {} } },
    });
    console.log('✅ Slug 컬럼 추가');
  } else {
    console.log('✅ Slug 컬럼 이미 존재');
  }

  const { results } = await notion.databases.query({ database_id: DB, page_size: 100 });
  const byTitle = new Map(
    results.map((page) => [
      (page.properties.Title?.title || []).map((t) => t.plain_text).join(''),
      page,
    ])
  );

  // 2. 비공개 프로젝트 글 unpublish
  for (const title of UNPUBLISH) {
    const page = byTitle.get(title);
    if (!page) { console.warn(`⚠️ 못 찾음: ${title}`); continue; }
    if (page.properties.Published?.checkbox === false) {
      console.log(`✅ 이미 unpublish: ${title}`);
      continue;
    }
    await notion.pages.update({
      page_id: page.id,
      properties: { Published: { checkbox: false } },
    });
    console.log(`✅ unpublish: ${title}`);
  }

  // 3. 기존 글 slug 부여 + 본문 보강
  for (const [title, data] of Object.entries(ENRICH)) {
    const page = byTitle.get(title);
    if (!page) { console.warn(`⚠️ 못 찾음: ${title}`); continue; }

    const currentSlug = (page.properties.Slug?.rich_text || []).map((t) => t.plain_text).join('');
    if (currentSlug !== data.slug) {
      await notion.pages.update({
        page_id: page.id,
        properties: { Slug: { rich_text: [{ text: { content: data.slug } }] } },
      });
    }

    const existing = await notion.blocks.children.list({ block_id: page.id, page_size: 10 });
    if (existing.results.length > 2) {
      console.log(`✅ 이미 보강됨: ${title}`);
      continue;
    }

    await notion.blocks.children.append({
      block_id: page.id,
      children: data.blocks.map((b) => ({ object: 'block', ...b })),
    });
    console.log(`✅ 본문 보강: ${title}`);
  }

  // 4. 신규 포스트 생성
  for (const post of NEW_POSTS) {
    if (byTitle.has(post.title)) {
      console.log(`✅ 이미 존재: ${post.title}`);
      continue;
    }
    await notion.pages.create({
      parent: { database_id: DB },
      properties: {
        Title: { title: [{ text: { content: post.title } }] },
        Slug: { rich_text: [{ text: { content: post.slug } }] },
        Description: { rich_text: [{ text: { content: post.description } }] },
        Date: { date: { start: post.date } },
        Category: { select: { name: post.category } },
        Tags: { multi_select: post.tags.map((t) => ({ name: t })) },
        ReadTime: { number: post.readTime },
        AuthorName: { rich_text: [{ text: { content: '이태규' } }] },
        Published: { checkbox: true },
      },
      children: post.blocks.map((b) => ({ object: 'block', ...b })),
    });
    console.log(`✅ 신규 생성: ${post.title}`);
  }

  console.log('\n완료. npm run build 후 npx vercel --prod 로 반영하세요.');
}

main().catch((e) => {
  console.error('❌ 오류:', e.message);
  process.exit(1);
});

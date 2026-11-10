import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let currentUser = null;
let profile = null;

const patterns = [
  {level:"beginner",pattern:"I want to + verb",meaning:"~하고 싶어요",example:"I want to try the local food.",ko:"현지 음식을 먹어 보고 싶어요."},
  {level:"beginner",pattern:"I'd like to + verb",meaning:"정중하게 ~하고 싶어요",example:"I'd like to make a reservation.",ko:"예약하고 싶습니다."},
  {level:"beginner",pattern:"Can I + verb?",meaning:"~해도 될까요?",example:"Can I sit here?",ko:"여기 앉아도 될까요?"},
  {level:"beginner",pattern:"Could you + verb?",meaning:"~해 주시겠어요?",example:"Could you speak more slowly?",ko:"조금 더 천천히 말씀해 주시겠어요?"},
  {level:"beginner",pattern:"I'm going to + verb",meaning:"~할 예정이에요",example:"I'm going to meet a friend after work.",ko:"퇴근 후에 친구를 만날 예정이에요."},
  {level:"beginner",pattern:"Do you want to + verb?",meaning:"같이 ~할래요?",example:"Do you want to grab some coffee?",ko:"커피 한잔할래요?"},
  {level:"beginner",pattern:"I have to + verb",meaning:"~해야 해요",example:"I have to leave in ten minutes.",ko:"10분 뒤에 가야 해요."},
  {level:"beginner",pattern:"I'm looking for + noun",meaning:"~을 찾고 있어요",example:"I'm looking for the nearest subway station.",ko:"가장 가까운 지하철역을 찾고 있어요."},
  {level:"beginner",pattern:"How about + -ing?",meaning:"~하는 건 어때요?",example:"How about meeting at seven?",ko:"7시에 만나는 건 어때요?"},
  {level:"beginner",pattern:"There is / There are",meaning:"~이 있어요",example:"There's a nice café around the corner.",ko:"모퉁이를 돌면 좋은 카페가 있어요."},
  {level:"intermediate",pattern:"I've been + -ing",meaning:"계속 ~해 오고 있어요",example:"I've been learning English for six months.",ko:"6개월 동안 영어를 배우고 있어요."},
  {level:"intermediate",pattern:"I used to + verb",meaning:"예전에는 ~하곤 했어요",example:"I used to live near the beach.",ko:"예전에는 해변 근처에 살았어요."},
  {level:"intermediate",pattern:"I'm used to + -ing",meaning:"~하는 데 익숙해요",example:"I'm used to working from home.",ko:"재택근무에 익숙해요."},
  {level:"intermediate",pattern:"I'm thinking of + -ing",meaning:"~할까 생각 중이에요",example:"I'm thinking of taking a short trip.",ko:"짧게 여행을 다녀올까 생각 중이에요."},
  {level:"intermediate",pattern:"It depends on + noun",meaning:"~에 따라 달라요",example:"It depends on the weather.",ko:"날씨에 따라 달라요."},
  {level:"intermediate",pattern:"The reason is that + clause",meaning:"그 이유는 ~이기 때문이에요",example:"The reason is that I need more time.",ko:"그 이유는 시간이 더 필요하기 때문이에요."},
  {level:"intermediate",pattern:"What do you think about + noun?",meaning:"~에 대해 어떻게 생각해요?",example:"What do you think about the new schedule?",ko:"새 일정에 대해 어떻게 생각해요?"},
  {level:"intermediate",pattern:"I would rather + verb",meaning:"차라리 ~하고 싶어요",example:"I'd rather stay in tonight.",ko:"오늘 밤은 차라리 집에 있고 싶어요."},
  {level:"intermediate",pattern:"As soon as + clause",meaning:"~하자마자",example:"I'll call you as soon as I arrive.",ko:"도착하자마자 전화할게요."},
  {level:"intermediate",pattern:"If I were you, I'd + verb",meaning:"내가 당신이라면 ~할 거예요",example:"If I were you, I'd talk to her first.",ko:"내가 당신이라면 먼저 그녀와 이야기할 거예요."},
  {level:"advanced",pattern:"I can't help + -ing",meaning:"~하지 않을 수 없어요",example:"I can't help worrying about the result.",ko:"결과를 걱정하지 않을 수 없어요."},
  {level:"advanced",pattern:"It's not that + clause",meaning:"~라는 건 아니에요",example:"It's not that I dislike it; I just need time.",ko:"싫다는 건 아니고, 시간이 좀 필요할 뿐이에요."},
  {level:"advanced",pattern:"What I mean is + clause",meaning:"내 말은 ~라는 뜻이에요",example:"What I mean is we should keep our options open.",ko:"내 말은 가능성을 열어 두자는 뜻이에요."},
  {level:"advanced",pattern:"The thing is, + clause",meaning:"문제는 / 실은 ~예요",example:"The thing is, I'm not available that day.",ko:"문제는 제가 그날 시간이 안 된다는 거예요."},
  {level:"advanced",pattern:"There's no point in + -ing",meaning:"~해도 소용없어요",example:"There's no point in arguing about it now.",ko:"지금 그것을 두고 다퉈 봐야 소용없어요."},
  {level:"advanced",pattern:"I ended up + -ing",meaning:"결국 ~하게 됐어요",example:"I ended up staying longer than I planned.",ko:"결국 계획보다 오래 머물게 됐어요."},
  {level:"advanced",pattern:"I was wondering if + clause",meaning:"혹시 ~인지 궁금했어요",example:"I was wondering if you could help me.",ko:"혹시 저를 도와주실 수 있는지 궁금했어요."},
  {level:"advanced",pattern:"It's worth + -ing",meaning:"~할 가치가 있어요",example:"It's worth checking out the neighborhood.",ko:"그 동네를 둘러볼 가치가 있어요."},
  {level:"advanced",pattern:"Not only A but also B",meaning:"A뿐만 아니라 B도",example:"It was not only useful but also enjoyable.",ko:"유용했을 뿐만 아니라 즐겁기도 했어요."},
  {level:"advanced",pattern:"The more..., the more...",meaning:"~할수록 더 ~해요",example:"The more I practice, the more confident I feel.",ko:"연습할수록 자신감이 더 생겨요."},
  {level:"beginner",pattern:"I need to + verb",meaning:"~할 필요가 있어요",example:"I need to charge my phone.",ko:"휴대폰을 충전해야 해요."},
  {level:"beginner",pattern:"I don't want to + verb",meaning:"~하고 싶지 않아요",example:"I don't want to be late again.",ko:"또 늦고 싶지 않아요."},
  {level:"beginner",pattern:"I like + noun / -ing",meaning:"~을 좋아해요",example:"I like walking around the city.",ko:"도시를 걸어 다니는 걸 좋아해요."},
  {level:"beginner",pattern:"I don't like + noun / -ing",meaning:"~을 좋아하지 않아요",example:"I don't like waiting in long lines.",ko:"긴 줄에서 기다리는 걸 좋아하지 않아요."},
  {level:"beginner",pattern:"I'm good at + -ing",meaning:"~을 잘해요",example:"I'm good at remembering faces.",ko:"저는 사람 얼굴을 잘 기억해요."},
  {level:"beginner",pattern:"I'm not good at + -ing",meaning:"~을 잘 못해요",example:"I'm not good at cooking.",ko:"저는 요리를 잘 못해요."},
  {level:"beginner",pattern:"I'm interested in + noun / -ing",meaning:"~에 관심이 있어요",example:"I'm interested in learning about local culture.",ko:"현지 문화를 배우는 데 관심이 있어요."},
  {level:"beginner",pattern:"I'm from + place",meaning:"~에서 왔어요",example:"I'm from Seoul, but I live in Busan now.",ko:"서울 출신이지만 지금은 부산에 살아요."},
  {level:"beginner",pattern:"I work as + job",meaning:"~으로 일해요",example:"I work as a graphic designer.",ko:"그래픽 디자이너로 일해요."},
  {level:"beginner",pattern:"I usually + verb",meaning:"보통 ~해요",example:"I usually take the bus to work.",ko:"저는 보통 버스를 타고 출근해요."},
  {level:"beginner",pattern:"I sometimes + verb",meaning:"가끔 ~해요",example:"I sometimes eat out on weekends.",ko:"주말에는 가끔 외식해요."},
  {level:"beginner",pattern:"I'm + adjective",meaning:"지금 상태나 감정을 말해요",example:"I'm a little nervous about the interview.",ko:"면접 때문에 조금 긴장돼요."},
  {level:"beginner",pattern:"Are you + adjective?",meaning:"지금 상태를 물어요",example:"Are you free this afternoon?",ko:"오늘 오후에 시간 괜찮아요?"},
  {level:"beginner",pattern:"Do you have + noun?",meaning:"~이 있나요?",example:"Do you have this in a larger size?",ko:"이거 더 큰 사이즈가 있나요?"},
  {level:"beginner",pattern:"How much is + noun?",meaning:"~은 얼마예요?",example:"How much is a one-way ticket?",ko:"편도 표는 얼마예요?"},
  {level:"beginner",pattern:"Where is + place?",meaning:"~은 어디예요?",example:"Where is the nearest restroom?",ko:"가장 가까운 화장실이 어디예요?"},
  {level:"beginner",pattern:"What time does + noun + verb?",meaning:"~은 몇 시에 하나요?",example:"What time does the store close?",ko:"가게는 몇 시에 문을 닫나요?"},
  {level:"beginner",pattern:"How long does it take to + verb?",meaning:"~하는 데 얼마나 걸려요?",example:"How long does it take to get downtown?",ko:"시내까지 가는 데 얼마나 걸려요?"},
  {level:"beginner",pattern:"May I have + noun?",meaning:"~을 주시겠어요?",example:"May I have the menu, please?",ko:"메뉴를 주시겠어요?"},
  {level:"beginner",pattern:"I'll have + food / drink",meaning:"~으로 할게요",example:"I'll have the chicken salad.",ko:"치킨 샐러드로 할게요."},
  {level:"beginner",pattern:"That's + adjective",meaning:"그건 ~하네요",example:"That's a great idea.",ko:"그거 좋은 생각이네요."},
  {level:"beginner",pattern:"It looks + adjective",meaning:"~해 보여요",example:"It looks delicious.",ko:"맛있어 보여요."},
  {level:"beginner",pattern:"Let's + verb",meaning:"같이 ~해요",example:"Let's take a break here.",ko:"여기서 잠깐 쉬어요."},
  {level:"beginner",pattern:"Please don't + verb",meaning:"~하지 말아 주세요",example:"Please don't forget your umbrella.",ko:"우산 잊지 말아 주세요."},
  {level:"beginner",pattern:"Thank you for + -ing",meaning:"~해 주셔서 고마워요",example:"Thank you for waiting for me.",ko:"저를 기다려 주셔서 고마워요."},
  {level:"intermediate",pattern:"Have you ever + past participle?",meaning:"~해 본 적 있어요?",example:"Have you ever traveled alone?",ko:"혼자 여행해 본 적 있어요?"},
  {level:"intermediate",pattern:"I've never + past participle",meaning:"한 번도 ~한 적이 없어요",example:"I've never tried surfing before.",ko:"서핑은 한 번도 해 본 적이 없어요."},
  {level:"intermediate",pattern:"I haven't + past participle + yet",meaning:"아직 ~하지 않았어요",example:"I haven't decided yet.",ko:"아직 결정하지 않았어요."},
  {level:"intermediate",pattern:"I just + past tense",meaning:"방금 ~했어요",example:"I just sent you the address.",ko:"방금 주소를 보냈어요."},
  {level:"intermediate",pattern:"I was about to + verb",meaning:"막 ~하려던 참이었어요",example:"I was about to call you.",ko:"막 전화하려던 참이었어요."},
  {level:"intermediate",pattern:"I was + -ing when + clause",meaning:"~하고 있었는데 그때…",example:"I was heading home when it started to rain.",ko:"집에 가고 있었는데 비가 내리기 시작했어요."},
  {level:"intermediate",pattern:"I'm supposed to + verb",meaning:"~하기로 되어 있어요",example:"I'm supposed to meet him at noon.",ko:"정오에 그를 만나기로 되어 있어요."},
  {level:"intermediate",pattern:"I might + verb",meaning:"~할지도 몰라요",example:"I might be a few minutes late.",ko:"몇 분 늦을지도 몰라요."},
  {level:"intermediate",pattern:"I'm not sure if + clause",meaning:"~인지 잘 모르겠어요",example:"I'm not sure if the museum is open today.",ko:"박물관이 오늘 여는지 잘 모르겠어요."},
  {level:"intermediate",pattern:"I hope + clause",meaning:"~하면 좋겠어요",example:"I hope everything goes well.",ko:"모든 일이 잘되면 좋겠어요."},
  {level:"intermediate",pattern:"I wish + past tense",meaning:"~라면 좋을 텐데요",example:"I wish I had more free time.",ko:"자유 시간이 더 많으면 좋을 텐데요."},
  {level:"intermediate",pattern:"Would you mind + -ing?",meaning:"~해 주시겠어요?",example:"Would you mind opening the window?",ko:"창문을 열어 주시겠어요?"},
  {level:"intermediate",pattern:"Would it be possible to + verb?",meaning:"혹시 ~할 수 있을까요?",example:"Would it be possible to change rooms?",ko:"혹시 방을 바꿀 수 있을까요?"},
  {level:"intermediate",pattern:"Do you mind if I + verb?",meaning:"제가 ~해도 괜찮을까요?",example:"Do you mind if I join you?",ko:"제가 함께해도 괜찮을까요?"},
  {level:"intermediate",pattern:"Why don't we + verb?",meaning:"우리 ~하는 게 어때요?",example:"Why don't we order something to share?",ko:"같이 나눠 먹을 걸 주문하는 게 어때요?"},
  {level:"intermediate",pattern:"I'd prefer to + verb",meaning:"~하는 편이 좋겠어요",example:"I'd prefer to sit outside.",ko:"밖에 앉는 편이 좋겠어요."},
  {level:"intermediate",pattern:"I'd rather not + verb",meaning:"가급적 ~하지 않고 싶어요",example:"I'd rather not drive at night.",ko:"가급적 밤에는 운전하고 싶지 않아요."},
  {level:"intermediate",pattern:"It seems like + clause",meaning:"~인 것 같아요",example:"It seems like everyone is having fun.",ko:"모두 즐거워하는 것 같아요."},
  {level:"intermediate",pattern:"It sounds like + clause",meaning:"들어 보니 ~인 것 같아요",example:"It sounds like you had a busy day.",ko:"오늘 바쁜 하루를 보낸 것 같네요."},
  {level:"intermediate",pattern:"That's why + clause",meaning:"그래서 ~한 거예요",example:"That's why I called you earlier.",ko:"그래서 제가 아까 전화한 거예요."},
  {level:"intermediate",pattern:"Even though + clause",meaning:"비록 ~이지만",example:"Even though I was tired, I went for a walk.",ko:"피곤했지만 산책하러 나갔어요."},
  {level:"intermediate",pattern:"In case + clause",meaning:"~할 경우에 대비해서",example:"Take a jacket in case it gets cold.",ko:"추워질 경우에 대비해서 재킷을 챙기세요."},
  {level:"intermediate",pattern:"Unless + clause",meaning:"~하지 않는 한",example:"We won't make it unless we leave now.",ko:"지금 출발하지 않으면 제시간에 못 가요."},
  {level:"intermediate",pattern:"I agree with + noun",meaning:"~에 동의해요",example:"I agree with you on that point.",ko:"그 점에서는 당신 의견에 동의해요."},
  {level:"intermediate",pattern:"I'm afraid + clause",meaning:"유감이지만 ~예요",example:"I'm afraid I can't make it tonight.",ko:"유감이지만 오늘 밤에는 못 갈 것 같아요."},
  {level:"advanced",pattern:"To be honest, + clause",meaning:"솔직히 말하면 ~예요",example:"To be honest, I expected a little more.",ko:"솔직히 말하면 조금 더 기대했어요."},
  {level:"advanced",pattern:"As far as I know, + clause",meaning:"제가 알기로는 ~예요",example:"As far as I know, the plan hasn't changed.",ko:"제가 알기로는 계획이 바뀌지 않았어요."},
  {level:"advanced",pattern:"As far as I'm concerned, + clause",meaning:"제 생각으로는 ~예요",example:"As far as I'm concerned, we're ready to start.",ko:"제 생각으로는 시작할 준비가 됐어요."},
  {level:"advanced",pattern:"From my point of view, + clause",meaning:"제 관점에서는 ~예요",example:"From my point of view, simplicity matters most.",ko:"제 관점에서는 단순함이 가장 중요해요."},
  {level:"advanced",pattern:"I tend to + verb",meaning:"저는 ~하는 편이에요",example:"I tend to overthink small decisions.",ko:"저는 작은 결정을 너무 많이 고민하는 편이에요."},
  {level:"advanced",pattern:"I'm likely to + verb",meaning:"~할 가능성이 커요",example:"I'm likely to stay late today.",ko:"오늘 늦게까지 있을 가능성이 커요."},
  {level:"advanced",pattern:"I have no choice but to + verb",meaning:"~할 수밖에 없어요",example:"I have no choice but to reschedule.",ko:"일정을 다시 잡을 수밖에 없어요."},
  {level:"advanced",pattern:"I can't afford to + verb",meaning:"~할 여유가 없어요",example:"I can't afford to miss this opportunity.",ko:"이 기회를 놓칠 여유가 없어요."},
  {level:"advanced",pattern:"I'm having trouble + -ing",meaning:"~하는 데 어려움을 겪고 있어요",example:"I'm having trouble understanding the instructions.",ko:"설명을 이해하는 데 어려움을 겪고 있어요."},
  {level:"advanced",pattern:"It took me + time + to + verb",meaning:"~하는 데 시간이 걸렸어요",example:"It took me a while to get used to the new system.",ko:"새 시스템에 익숙해지는 데 시간이 좀 걸렸어요."},
  {level:"advanced",pattern:"There's a chance that + clause",meaning:"~할 가능성이 있어요",example:"There's a chance that the flight will be delayed.",ko:"비행기가 지연될 가능성이 있어요."},
  {level:"advanced",pattern:"Chances are + clause",meaning:"아마 ~일 가능성이 커요",example:"Chances are it'll be crowded tonight.",ko:"아마 오늘 밤은 붐빌 가능성이 커요."},
  {level:"advanced",pattern:"No matter + question word",meaning:"아무리 / 무엇을 ~하더라도",example:"No matter what happens, I'll support you.",ko:"무슨 일이 있어도 당신을 지지할게요."},
  {level:"advanced",pattern:"Whether A or B",meaning:"A든 B든",example:"Whether we win or lose, we'll learn something.",ko:"이기든 지든 우리는 무언가를 배울 거예요."},
  {level:"advanced",pattern:"It's only a matter of time before + clause",meaning:"~하는 것은 시간문제예요",example:"It's only a matter of time before she finds out.",ko:"그녀가 알게 되는 것은 시간문제예요."},
  {level:"advanced",pattern:"Had I known, I would have + p.p.",meaning:"알았더라면 ~했을 텐데요",example:"Had I known, I would have come earlier.",ko:"알았더라면 더 일찍 왔을 텐데요."},
  {level:"advanced",pattern:"I could have + past participle",meaning:"~할 수도 있었어요",example:"I could have handled it better.",ko:"제가 그 일을 더 잘 처리할 수도 있었어요."},
  {level:"advanced",pattern:"I should have + past participle",meaning:"~했어야 했어요",example:"I should have checked the schedule first.",ko:"일정을 먼저 확인했어야 했어요."},
  {level:"advanced",pattern:"I might have + past participle",meaning:"~했을지도 몰라요",example:"I might have left my keys at the office.",ko:"열쇠를 사무실에 두고 왔을지도 몰라요."},
  {level:"advanced",pattern:"It turns out that + clause",meaning:"알고 보니 ~였어요",example:"It turns out that we have a mutual friend.",ko:"알고 보니 우리에게 공통 친구가 있더라고요."}
];

const state = {
  minutes: Number(localStorage.getItem("saying.minutes")) || 20,
  step: Number(localStorage.getItem("saying.step")) || 0,
  selectedWord: "eat"
};

const localProgress = JSON.parse(localStorage.getItem("saying.completedPatterns") || "[]");

async function ensureProfile(nickname = "SAYING learner") {
  if (!currentUser) return;
  const { data } = await supabase.from("profiles").upsert({ id: currentUser.id, nickname, email: currentUser.email }, { onConflict: "id" }).select().single();
  profile = data || profile;
  if (profile) {
    document.querySelector("#profile-nickname").textContent = profile.nickname;
    document.querySelector("#profile-email").textContent = currentUser.email || "";
    document.querySelector("#profile-level").value = profile.level;
    document.querySelector("#profile-minutes").value = String(profile.default_minutes);
  }
}

async function loadUserData() {
  if (!currentUser) return;
  await ensureProfile();
  const { data: remote } = await supabase.from("user_pattern_progress").select("pattern_id").eq("user_id", currentUser.id);
  const merged = new Set([...(remote || []).map(row => row.pattern_id), ...localProgress]);
  if (localProgress.length) {
    await supabase.from("user_pattern_progress").upsert([...merged].map(pattern_id => ({ user_id: currentUser.id, pattern_id, mastery_level: 1 })), { onConflict: "user_id,pattern_id" });
  }
  localStorage.setItem("saying.completedPatterns", JSON.stringify([...merged]));
  const { data: diaries } = await supabase.from("daily_diaries").select("id, diary_date, original_text, korean_intent").order("diary_date", { ascending: false }).limit(20);
  document.querySelector("#diary-list").innerHTML = (diaries || []).map(d => `<article class="diary-item"><small>${d.diary_date}</small><p>${escapeHtml(d.original_text)}</p>${d.korean_intent ? `<span>${escapeHtml(d.korean_intent)}</span>` : ""}</article>`).join("") || "<p class='auth-message'>저장된 일기가 없습니다.</p>";
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char])); }

async function initAuth() {
  const { data } = await supabase.auth.getUser();
  currentUser = data.user;
  updateAuthUI();
  if (currentUser) await loadUserData();
  supabase.auth.onAuthStateChange(async (_event, session) => { currentUser = session?.user || null; updateAuthUI(); if (currentUser) await loadUserData(); });
}

function updateAuthUI() {
  const loggedIn = Boolean(currentUser);
  document.querySelector("#auth-form [data-auth=login]").hidden = loggedIn;
  document.querySelector("#auth-form [data-auth=signup]").hidden = loggedIn;
  document.querySelector("#auth-form [data-auth=reset]").hidden = loggedIn;
  document.querySelector("#auth-form [data-auth=logout]").hidden = !loggedIn;
  document.querySelector("#auth-nickname").hidden = loggedIn;
  document.querySelector("#auth-email").value = loggedIn ? (currentUser.email || "") : "";
  document.querySelector("#auth-message").textContent = loggedIn ? "로그인 상태입니다. 진도와 일기를 계정에 저장합니다." : "로그인하지 않은 상태에서는 개인 데이터를 서버에 저장하지 않습니다.";
}

async function saveDiary() {
  if (!currentUser) return toast("먼저 로그인해 주세요.");
  const original_text = document.querySelector("#diary-text").value.trim();
  const korean_intent = document.querySelector("#diary-intent").value.trim() || null;
  if (!original_text) return;
  const { error } = await supabase.from("daily_diaries").insert({ user_id: currentUser.id, original_text, korean_intent });
  if (error) return toast(error.message);
  document.querySelector("#diary-form").reset(); await loadUserData(); toast("영어 일기를 저장했어요.");
}

async function sendPartnerInvite() {
  if (!currentUser) return toast("먼저 로그인해 주세요.");
  const email = document.querySelector("#partner-email").value.trim();
  const { error } = await supabase.rpc("request_partner_by_email", { target_email: email });
  if (error?.message?.includes("PARTNER_NOT_FOUND")) return toast("상대방이 먼저 회원가입해야 합니다.");
  toast(error ? error.message : "학습 파트너 초대를 보냈어요.");
}

const lessonSteps = [
  () => `<div class="lesson-meta"><span class="step-label">STEP 1 · PATTERN</span><button class="audio-button" type="button" data-audio>듣기 ▷</button></div><h1 id="learn-heading">I want to go home.</h1><p class="translation">나는 집에 가고 싶어요.</p><div class="pattern-focus"><span>오늘의 핵심 패턴</span><strong>I want to + 동사원형</strong></div><p class="explanation"><b>I want to</b> 뒤에 행동을 나타내는 동사원형을 붙이면, 내가 하고 싶은 일을 자연스럽게 말할 수 있어요.</p>${actions("이해했어요")}`,
  () => `<div class="lesson-meta"><span class="step-label">STEP 2 · CHANGE</span><span>단어 바꾸기</span></div><h1 id="learn-heading">I want to <span style="color:var(--primary)">${state.selectedWord}</span>.</h1><p class="translation">단어를 바꿔 문장을 소리 내어 읽어보세요.</p><div class="choice-list">${["eat","sleep","travel","learn English"].map(word => `<button type="button" data-word="${word}" class="${word===state.selectedWord?"selected":""}">${word}</button>`).join("")}</div>${actions("다음으로")}`,
  () => `<div class="lesson-meta"><span class="step-label">STEP 3 · WRITE</span><span>직접 만들기</span></div><h1 id="learn-heading" style="font-family:var(--font-ko);font-size:30px">“나는 영어를 배우고 싶어요.”</h1><p class="translation">영어 문장으로 직접 써보세요.</p><input class="answer-input" id="answer" autocomplete="off" placeholder="I want to..." aria-label="영어 문장 입력"><div id="answer-feedback"></div><div class="lesson-actions"><button class="button ghost" type="button" data-check>정답 확인</button><button class="button primary" type="button" data-next disabled>다음으로</button></div>`,
  () => `<div class="lesson-meta"><span class="step-label">STEP 4 · DIALOGUE</span><span>카페에서</span></div><h1 id="learn-heading" style="font-size:31px">What do you want to drink?</h1><div class="dialogue"><div class="bubble">What do you want to drink?</div><div class="bubble me">I want to have some coffee.</div><div class="bubble">Hot or iced?</div><div class="bubble me">I want to have it iced, please.</div></div><p class="explanation">상황 속에서 같은 패턴이 어떻게 이어지는지 확인해 보세요.</p>${actions("회화 연습 완료")}`,
  () => `<div class="lesson-meta"><span class="step-label">COMPLETE</span><span>오늘의 학습</span></div><h1 id="learn-heading" style="font-family:var(--font-ko)">오늘의 문장이<br>나의 말이 되었어요.</h1><p class="translation">I want to + 동사원형 패턴을 완료했어요.</p><div class="pattern-focus"><span>오늘의 기록</span><strong>${state.minutes}분 코스 · 1개 패턴 · 4개 문장</strong></div><div class="lesson-actions"><button class="button ghost" type="button" data-nav="patterns">패턴 보기</button><button class="button primary" type="button" data-finish>학습 마치기</button></div>`
];

function actions(label) { return `<div class="lesson-actions"><button class="button primary" type="button" data-next>${label} →</button></div>`; }

function navigate(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === id));
  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.toggle("active", b.dataset.nav === id));
  document.querySelector(".bottom-nav").hidden = id === "learn";
  document.querySelector(".topbar").hidden = id === "learn";
  if (id === "learn") renderLesson();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderLesson() {
  document.querySelector("#lesson-content").innerHTML = lessonSteps[state.step]();
  document.querySelector("#step-count").textContent = `${state.step + 1} / 5`;
  document.querySelector("#step-bar").style.width = `${(state.step + 1) * 20}%`;
  localStorage.setItem("saying.step", state.step);
}

function toast(message) {
  const el = document.querySelector(".toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
}

document.addEventListener("click", async event => {
  const nav = event.target.closest("[data-nav]"); if (nav) { navigate(nav.dataset.nav); return; }
  const duration = event.target.closest("[data-minutes]");
  if (duration) {
    state.minutes = Number(duration.dataset.minutes); localStorage.setItem("saying.minutes", state.minutes);
    document.querySelectorAll("[data-minutes]").forEach(btn => { const selected = btn === duration; btn.classList.toggle("selected", selected); btn.setAttribute("aria-checked", selected); });
    document.querySelector("#resume-note").textContent = `약 ${state.minutes}분 · ${state.minutes === 10 ? 4 : 5}단계 학습`; return;
  }
  if (event.target.closest("#start-learning")) { state.step = state.step >= 4 ? 0 : state.step; navigate("learn"); return; }
  const word = event.target.closest("[data-word]"); if (word) { state.selectedWord = word.dataset.word; renderLesson(); return; }
  if (event.target.closest("[data-next]")) { state.step = Math.min(4, state.step + 1); renderLesson(); return; }
  if (event.target.closest("[data-check]")) {
    const input = document.querySelector("#answer"); const normalized = input.value.trim().toLowerCase().replace(/[.!?]/g, "");
    const correct = normalized === "i want to learn english";
    document.querySelector("#answer-feedback").innerHTML = `<div class="feedback" style="${correct ? "" : "background:var(--accent);color:var(--primary-dark)"}">${correct ? "좋아요! 자연스럽고 정확한 문장이에요." : "거의 다 왔어요. 예시: I want to learn English."}</div>`;
    document.querySelector("[data-next]").disabled = false; if (correct) input.setAttribute("aria-invalid", "false"); return;
  }
  if (event.target.closest("[data-finish]")) { state.step = 0; localStorage.setItem("saying.step", 0); if (currentUser) await supabase.from("user_pattern_progress").upsert({ user_id: currentUser.id, pattern_id: 1, mastery_level: 1, completed_at: new Date().toISOString() }, { onConflict: "user_id,pattern_id" }); navigate("home"); toast("오늘의 학습을 완료했어요."); return; }
  const authButton = event.target.closest("[data-auth]");
  if (authButton) {
    const email = document.querySelector("#auth-email").value.trim();
    const password = document.querySelector("#auth-password").value;
    const nickname = document.querySelector("#auth-nickname").value.trim() || "SAYING learner";
    let result;
    if (authButton.dataset.auth === "signup") result = await supabase.auth.signUp({ email, password, options: { data: { nickname }, emailRedirectTo: location.href } });
    if (authButton.dataset.auth === "login") result = await supabase.auth.signInWithPassword({ email, password });
    if (authButton.dataset.auth === "reset") result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.href });
    if (authButton.dataset.auth === "logout") result = await supabase.auth.signOut();
    if (result?.error) toast(result.error.message); else toast(authButton.dataset.auth === "reset" ? "비밀번호 재설정 이메일을 보냈어요." : "처리되었습니다.");
    if (authButton.dataset.auth === "signup" && !result?.error) await ensureProfile(nickname);
    return;
  }
  if (event.target.closest("#diary-form")) return;
  if (event.target.closest("#partner-form")) return;
  if (event.target.closest("[data-audio]")) {
    if ("speechSynthesis" in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance("I want to go home.")); } else toast("이 브라우저에서는 음성 재생을 지원하지 않아요."); return;
  }
  const speak = event.target.closest("[data-speak]");
  if (speak) {
    if ("speechSynthesis" in window) { speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(speak.dataset.speak); utterance.lang = "en-US"; speechSynthesis.speak(utterance); }
    return;
  }
  if (event.target.closest(".cheer-button")) { event.target.closest(".cheer-button").textContent = "응원을 보냈어요 ✓"; toast("제이미에게 응원을 보냈어요."); return; }
  if (event.target.closest("#review-start")) { state.step = 2; navigate("learn"); return; }
  const filter = event.target.closest("[data-level]");
  if (filter) {
    document.querySelectorAll("[data-level]").forEach(button => button.classList.toggle("active", button === filter));
    renderPatterns(filter.dataset.level); return;
  }
  const patternItem = event.target.closest(".pattern-item");
  if (patternItem) {
    const expanded = patternItem.getAttribute("aria-expanded") === "true";
    patternItem.setAttribute("aria-expanded", String(!expanded));
    patternItem.classList.toggle("expanded", !expanded); return;
  }
});

document.querySelector("#diary-form")?.addEventListener("submit", event => { event.preventDefault(); saveDiary(); });
document.querySelector("#partner-form")?.addEventListener("submit", event => { event.preventDefault(); sendPartnerInvite(); });

document.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches(".pattern-item")) {
    event.preventDefault(); event.target.click();
  }
});

function renderPatterns(level = "all") {
  const levelNames = {beginner:"초급", intermediate:"중급", advanced:"고급"};
  const levelOrder = {beginner:0, intermediate:1, advanced:2};
  const orderedPatterns = patterns.map((item, sourceIndex) => ({...item, sourceIndex})).sort((a, b) => levelOrder[a.level] - levelOrder[b.level] || a.sourceIndex - b.sourceIndex);
  const visible = level === "all" ? orderedPatterns : orderedPatterns.filter(item => item.level === level);
  document.querySelector("#pattern-list").innerHTML = visible.map(item => {
    const number = String(orderedPatterns.indexOf(item) + 1).padStart(2, "0");
    return `<article class="pattern-item" tabindex="0" role="button" aria-expanded="false">
      <span>${number}</span><div class="pattern-summary"><span class="pattern-level ${item.level}">${levelNames[item.level]}</span><strong>${item.pattern}</strong><p>${item.meaning}</p></div><span class="expand-mark" aria-hidden="true">＋</span>
      <div class="pattern-example"><span>REAL TALK EXAMPLE</span><strong>${item.example}</strong><p>${item.ko}</p><button type="button" class="audio-button" data-speak="${item.example}">예문 듣기 ▷</button></div>
    </article>`;
  }).join("");
}

renderPatterns();
document.querySelectorAll("[data-minutes]").forEach(btn => { const selected = Number(btn.dataset.minutes) === state.minutes; btn.classList.toggle("selected", selected); btn.setAttribute("aria-checked", selected); });
document.querySelector("#resume-note").textContent = `약 ${state.minutes}분 · ${state.minutes === 10 ? 4 : 5}단계 학습`;
initAuth();

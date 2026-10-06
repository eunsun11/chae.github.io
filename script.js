const STORAGE_KEY = "jeju_trip_checklist_v2";

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", () => {
    loadStates();
    bindEvents();
    updateProgress();
});

function bindEvents() {
    // 날짜 탭
    $$(".day-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            $$(".day-tab").forEach((btn) => btn.classList.remove("active"));
            $$(".day-panel").forEach((panel) => panel.classList.remove("active"));

            tab.classList.add("active");

            const panel = document.getElementById(tab.dataset.day);
            if (panel) {
                panel.classList.add("active");
            }

            document.getElementById("schedule")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    });

    // 일정 완료 체크
    $$(".plan-card").forEach((card) => {
        card.addEventListener("click", (event) => {
            if (event.target.closest(".map-btn")) return;

            toggleCard(card);
        });
    });

    // 네이버지도
    $$(".map-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const place = button.dataset.map;
            if (!place) return;

            const url = "https://map.naver.com/p/search/" + encodeURIComponent(place);

            window.open(url, "_blank", "noopener,noreferrer");
        });
    });

    // 전체 초기화
    $("#resetBtn")?.addEventListener("click", resetChecklist);

    // 완료 일정 전체 해제
    $("#clearDoneBtn")?.addEventListener("click", () => {
        const completed = $$(".plan-card.completed");

        if (!completed.length) {
            showToast("아직 완료한 일정이 없어요.");
            return;
        }

        completed.forEach((card) => {
            setCardState(card, false);
        });

        saveStates();
        updateProgress();
        showToast("완료 표시를 모두 해제했어요.");
    });

    // 퀵메뉴 - 전체 일정
    $$(".quick-card[data-target]").forEach((button) => {
        button.addEventListener("click", () => {
            const target = document.getElementById(button.dataset.target);

            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        });
    });

    // 하단 메뉴
    $$(".nav-item[data-target]").forEach((button) => {
        button.addEventListener("click", () => {
            $$(".nav-item").forEach((item) => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            const target = document.getElementById(button.dataset.target);

            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        });
    });

    // 하단 지도 메뉴
    $("#navMap")?.addEventListener("click", () => {
        const activeMapButton = $(".day-panel.active .map-btn");

        if (activeMapButton) {
            activeMapButton.click();
        } else {
            showToast("지도에서 볼 일정이 없어요.");
        }
    });

    // 지도 퀵메뉴
    $("#mapAllBtn")?.addEventListener("click", () => {
        const firstMapButton = $(".day-panel.active .map-btn");

        if (firstMapButton) {
            firstMapButton.click();
            showToast("오늘 일정의 첫 장소를 지도에서 열었어요.");
        } else {
            showToast("지도에서 볼 일정이 없어요.");
        }
    });

    // 공유 버튼
    $("#shareBtn")?.addEventListener("click", async () => {
        const shareData = {
            title: "JEJU 2026",
            text: "나의 제주 여행 일정",
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
                showToast("사이트 주소를 복사했어요.");
            } else {
                showToast("현재 브라우저에서는 공유 기능을 사용할 수 없어요.");
            }
        } catch (error) {
            // 사용자가 공유창을 닫은 경우에는 아무것도 하지 않음
        }
    });
}

// 일정 완료 상태 변경
function toggleCard(card) {
    const isCompleted = card.classList.contains("completed");

    setCardState(card, !isCompleted);
    saveStates();
    updateProgress();
}

// 카드 상태 적용
function setCardState(card, completed) {
    card.classList.toggle("completed", completed);
}

// localStorage에 저장
function saveStates() {
    const states = {};

    $$(".plan-card").forEach((card) => {
        const id = card.dataset.id;

        if (id) {
            states[id] = card.classList.contains("completed");
        }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

// localStorage에서 불러오기
function loadStates() {
    let states = {};

    try {
        states = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
        states = {};
    }

    $$(".plan-card").forEach((card) => {
        const id = card.dataset.id;

        if (id && states[id]) {
            setCardState(card, true);
        }
    });
}

// 전체 진행률 업데이트
function updateProgress() {
    const cards = $$(".plan-card");
    const completedCards = $$(".plan-card.completed");

    const total = cards.length;
    const done = completedCards.length;

    const percent = total ? Math.round((done / total) * 100) : 0;

    if ($("#totalCount")) {
        $("#totalCount").textContent = total;
    }

    if ($("#doneCount")) {
        $("#doneCount").textContent = done;
    }

    if ($("#progressPercent")) {
        $("#progressPercent").textContent = percent + "%";
    }

    if ($("#progressBar")) {
        $("#progressBar").style.width = percent + "%";
    }

    if ($("#quickDone")) {
        $("#quickDone").textContent = done + "개 체크";
    }

    if ($("#progressText")) {
        if (percent === 100) {
            $("#progressText").textContent = "준비 완료! 이제 제주로 떠나면 돼요.";
        } else if (done === 0) {
            $("#progressText").textContent = "하나씩 체크하면서 여행을 준비해보세요.";
        } else {
            $("#progressText").textContent = `전체 ${total}개 일정 중 ${done}개를 완료했어요.`;
        }
    }
}

// 체크리스트 전체 초기화
function resetChecklist() {
    const confirmed = confirm("모든 체크 표시를 초기화할까요?");

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);

    $$(".plan-card").forEach((card) => {
        setCardState(card, false);
    });

    updateProgress();
    showToast("체크리스트를 초기화했어요.");
}

// 토스트 메시지
let toastTimer;

function showToast(message) {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

path = Path("/mnt/data/script.js");
path.write_text(js, (encoding = "utf-8"));

print("완료: {path}");
print("파일 크기: {path.stat().st_size:,} bytes");

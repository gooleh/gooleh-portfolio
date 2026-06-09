<script lang="ts">
  import { slide } from "svelte/transition";
  import { onDestroy, tick } from "svelte";

  interface Learning {
    title: string;
    description: string;
    date: string;
  }

  const learnings: Learning[] = [
    {
      title: "vibe coding & personal projects",
      description:
        "AI-assisted development with claude code. astro 5, svelte 5, three.js / threlte, tailwind css v3, notion API, lenis, GSAP, vercel — building this portfolio and other side projects.",
      date: "2025-08",
    },
    {
      title: "data communication & AI",
      description:
        "data communication, artificial intelligence.",
      date: "2025-03",
    },
    {
      title: "front-end, big data & capstone",
      description:
        "front-end development, big data processing, wireless networks, LINC capstone design.",
      date: "2024-09",
    },
    {
      title: "server, mobile & AI programming",
      description:
        "server programming, mobile programming, AI programming, TCP/IP, software engineering, startup project.",
      date: "2024-03",
    },
    {
      title: "java, sql & operating systems",
      description:
        "Java, JSP, Oracle SQL & PL/SQL, operating systems, information security, system analysis & design, SW project.",
      date: "2023-09",
    },
    {
      title: "OOP, data structures & IoT",
      description:
        "C#, object-oriented programming, databases, data structures, IoT, enterprise server management.",
      date: "2023-03",
    },
    {
      title: "C, Python, JavaScript & networking",
      description:
        "C programming, JavaScript, Python, server setup, computer architecture, information security.",
      date: "2022-09",
    },
    {
      title: "CS fundamentals",
      description:
        "C programming, algorithm basics, web programming, computer science fundamentals, networking.",
      date: "2022-03",
    },
  ];

  function formatDate(date: string) {
    return new Date(date)
      .toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
      .toLowerCase();
  }

  let showAll = false;
  let scrollCleanup: (() => void) | null = null;

  function cleanup() {
    if (scrollCleanup) {
      scrollCleanup();
      scrollCleanup = null;
    }
  }

  async function handleShowAll() {
    showAll = true;
    await tick();

    const section = document.getElementById('learning');
    if (!section) return;

    // 펼쳐진 후 섹션 하단의 절대 Y 좌표
    const sectionBottom = section.getBoundingClientRect().bottom + window.scrollY;
    const scrollYAtExpansion = window.scrollY;

    const onScroll = () => {
      const viewportBottom = window.scrollY + window.innerHeight;
      // 최소 150px 이상 스크롤했고, 뷰포트 하단이 섹션 끝을 80px 이상 지났을 때 접힘
      const scrolledEnough = window.scrollY > scrollYAtExpansion + 150;
      const passedContent = viewportBottom > sectionBottom + 80;

      if (scrolledEnough && passedContent) {
        showAll = false;
        cleanup();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    scrollCleanup = () => window.removeEventListener('scroll', onScroll);
  }

  onDestroy(cleanup);

  $: shownLearnings = showAll ? learnings : [...learnings].slice(0, 3);
</script>

<div class="relative isolate overflow-hidden bg-background">
  <div class="mx-auto max-w-5xl px-6 lg:px-8">
    <div id="learning" class="py-16 md:py-32 section">
      <div class="max-w-2xl">
        <h1
          class="text-4xl font-bold tracking-tight text-base-800 dark:text-base-100 sm:text-5xl"
        >
          always keep learning
        </h1>
        <p class="mt-6 text-base text-base-600 dark:text-base-400">
          one of the things i love most about programming is that there's always
          something new to learn. here's a selection of some of the things i've
          been learning lately:
        </p>
      </div>
      <div
        class="mt-16 md:border-l md:border-base-100 md:pl-6 md:dark:border-base-700/40"
      >
        <div class="flex max-w-3xl flex-col space-y-16">
          {#each shownLearnings as learning}
            <article
              transition:slide
              class="md:grid md:grid-cols-4 md:items-baseline"
            >
              <div
                class="group relative flex flex-col items-start md:col-span-3"
              >
                <div
                  class="text-base font-semibold tracking-tight text-base-800 dark:text-base-100"
                >
                  {learning.title}
                </div>
                <div
                  class="relative z-10 order-first mb-3 flex items-center text-sm text-base-400 dark:text-base-500 pl-3.5 mt-1 md:hidden"
                >
                  <span
                    class="absolute inset-y-0 left-0 flex items-center"
                    aria-hidden="true"
                  >
                    <span
                      class="h-4 w-0.5 rounded-full bg-base-200 dark:bg-base-500"
                    />
                  </span>
                  {formatDate(learning.date)}
                </div>

                <p
                  class="relative z-10 mt-2 text-sm text-base-600 dark:text-base-400"
                >
                  {learning.description}
                </p>
              </div>
              <div
                class="relative z-10 order-first mb-3 items-center text-sm text-base-400 dark:text-base-500 mt-1 hidden md:block"
              >
                {formatDate(learning.date)}
              </div>
            </article>
          {/each}

          {#if !showAll}
            <div class="justify-center flex">
              <button
                on:click={handleShowAll}
                type="button"
                class="group flex items-center rounded-full mr-4 bg-white/90 px-4 py-2 text-sm font-medium text-base-800 shadow-lg shadow-base-800/5 ring-1 ring-base-900/5 backdrop-blur dark:bg-white/5 dark:text-base-200 dark:ring-white/10 dark:hover:ring-white/20"
                aria-label="Update dimensions"
              >
                show more

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="ml-2 h-auto w-4 stroke-base-500 group-hover:stroke-base-700 dark:group-hover:stroke-base-400"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

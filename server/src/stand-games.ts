import { randomUUID } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { database as db } from "./database.js";
import { createArena } from "./arena.js";
import { atomicService } from "./database-driver.js";
declare module "express-session" {
  interface SessionData {
    standOwner?: string;
  }
}
type Text = {
  tr: string;
  en: string;
};
type Claim = {
  statement: Text;
  fact: boolean;
  why: Text;
};
const myths: Claim[] = [
  {
    statement: {
      tr: "Gizli sekme seni internette tamamen anonim yapar.",
      en: "Private browsing makes you completely anonymous online.",
    },
    fact: false,
    why: {
      tr: "Gizli sekme cihazda tutulan geçmişi sınırlar. Siteler ve ağ işletmecileri etkinliği yine görebilir.",
      en: "Private browsing limits history stored on your device. Sites and network operators may still observe activity.",
    },
  },
  {
    statement: {
      tr: "Bir QR kod, sahte bir siteye yönlendirebilir.",
      en: "A QR code can lead to a fraudulent website.",
    },
    fact: true,
    why: {
      tr: "QR kod yalnızca veri taşır. İçindeki bağlantının güvenilir olduğunu garanti etmez.",
      en: "A QR code carries data. It does not guarantee that a link is trustworthy.",
    },
  },
  {
    statement: {
      tr: "HTTPS olan her site güvenilir bir işletmeye aittir.",
      en: "Every HTTPS website belongs to a trustworthy business.",
    },
    fact: false,
    why: {
      tr: "HTTPS bağlantıyı şifreler. Dolandırıcı bir site de HTTPS kullanabilir.",
      en: "HTTPS encrypts the connection. A fraudulent website can use it too.",
    },
  },
  {
    statement: {
      tr: "RAM ve depolama alanı farklı şeylerdir.",
      en: "RAM and storage are different resources.",
    },
    fact: true,
    why: {
      tr: "RAM etkin programların çalışma verilerini tutar. Depolama ise dosyaları daha uzun süre saklar.",
      en: "RAM holds working data for active programs. Storage retains files over time.",
    },
  },
  {
    statement: {
      tr: "Her USB-C kablo aynı veri hızını destekler.",
      en: "Every USB-C cable supports the same data speed.",
    },
    fact: false,
    why: {
      tr: "USB-C bir bağlantı biçimidir; kabloların hız ve güç özellikleri farklı olabilir.",
      en: "USB-C describes a connector. Cable data and power capabilities can differ.",
    },
  },
  {
    statement: {
      tr: "Aynı şifreyi her yerde kullanmak, bir hesap sızıntısının etkisini büyütebilir.",
      en: "Reusing a password can make one account breach affect other accounts.",
    },
    fact: true,
    why: {
      tr: "Bir sızıntıda ele geçen şifre, başka hesaplarda da denenebilir.",
      en: "A password exposed in one breach can be tried against other accounts.",
    },
  },
  {
    statement: {
      tr: "Açık kaynak yazılımın lisans koşulları olabilir.",
      en: "Open-source software can have licence conditions.",
    },
    fact: true,
    why: {
      tr: "Kaynağın açık olması lisans yükümlülüklerini ortadan kaldırmaz.",
      en: "Available source code does not remove licence obligations.",
    },
  },
  {
    statement: {
      tr: "Bir dosyanın uzantısı, içeriğinin ne olduğunu tek başına kanıtlar.",
      en: "A filename extension alone proves what a file contains.",
    },
    fact: false,
    why: {
      tr: "Dosya adları değiştirilebilir. Gerçek içerik ayrıca incelenmelidir.",
      en: "Filenames can be changed. The actual contents may need inspection.",
    },
  },
  {
    statement: {
      tr: "Yazılım güncellemeleri güvenlik açıklarını düzeltebilir.",
      en: "Software updates can fix security vulnerabilities.",
    },
    fact: true,
    why: {
      tr: "Güncellemeler yeni özelliklerle birlikte güvenlik ve kararlılık düzeltmeleri de içerebilir.",
      en: "Updates can include security and reliability fixes as well as new features.",
    },
  },
  {
    statement: {
      tr: "Bir ekran görüntüsü tek başına her zaman eksiksiz kanıttır.",
      en: "A screenshot alone is always complete proof.",
    },
    fact: false,
    why: {
      tr: "Ekran görüntüsü sınırlı bağlam taşır ve düzenlenebilir. Başka kayıtlarla desteklemek gerekir.",
      en: "Screenshots have limited context and can be edited. Corroborating records matter.",
    },
  },
  {
    statement: {
      tr: "Senkronize klasör ve yedek her durumda aynı korumayı sağlar.",
      en: "A synced folder always provides the same protection as a backup.",
    },
    fact: false,
    why: {
      tr: "Senkronizasyon silinen veya bozulan dosyaları diğer cihazlara da aktarabilir. Sürümlü yedek eski kopyaları koruyabilir.",
      en: "Sync can propagate deletions or damage. Versioned backups can preserve earlier copies.",
    },
  },
  {
    statement: {
      tr: "Bluetooth ve Wi-Fi farklı kablosuz teknolojilerdir.",
      en: "Bluetooth and Wi-Fi are different wireless technologies.",
    },
    fact: true,
    why: {
      tr: "Farklı bağlantı ihtiyaçları için tasarlanırlar; bazıları aynı radyo frekanslarını paylaşabilir.",
      en: "They serve different connection needs, though some implementations share radio frequencies.",
    },
  },
  {
    statement: {
      tr: "Bir tarayıcı ile arama motoru aynı şeydir.",
      en: "A browser and a search engine are the same thing.",
    },
    fact: false,
    why: {
      tr: "Tarayıcı web içeriğini açar. Arama motoru içerik bulmanı sağlayan bir hizmettir.",
      en: "A browser opens web content. A search engine is a service that helps find content.",
    },
  },
  {
    statement: {
      tr: "Bir yapay zekâ kendinden emin görünse de yanlış bilgi verebilir.",
      en: "An AI can sound confident while giving incorrect information.",
    },
    fact: true,
    why: {
      tr: "Akıcı veya kendinden emin bir yanıt doğruluk garantisi değildir. Önemli iddiaları kaynaklarla kontrol et.",
      en: "Fluency or confidence does not guarantee accuracy. Check important claims against sources.",
    },
  },
  {
    statement: {
      tr: "Bir kısayolu silmek, genellikle asıl programı da siler.",
      en: "Deleting a shortcut usually deletes the original program too.",
    },
    fact: false,
    why: {
      tr: "Kısayol başka bir konumu işaret eder. Onu silmek çoğunlukla asıl dosyayı etkilemez.",
      en: "A shortcut points to another location. Removing it normally leaves the target intact.",
    },
  },
];
type Case = {
  title: Text;
  brief: Text;
  clues: {
    time: string;
    text: Text;
  }[];
  questions: {
    text: Text;
    options: Text[];
    answer: number;
    why: Text;
  }[];
};
const cases: Case[] = [
  {
    title: { tr: "Kayıp Kulüp Dosyası", en: "The Missing Club File" },
    brief: {
      tr: "Bu kurgu vakada kulübün dosyaları bilinmeyen bir hesaba gönderilmiş. Üç kaydı incele; yalnızca kanıtın gösterdiği sonuca var.",
      en: "In this fictional case, club files were sent to an unknown account. Read three records and conclude only what the evidence supports.",
    },
    clues: [
      {
        time: "14:02",
        text: {
          tr: "E-posta: “Hesabın kapanacak” mesajı, kulüp üyesini campus-help.example adlı sahte giriş sayfasına yönlendirdi.",
          en: "Email: an 'account closing' message directed a club member to the fake login page campus-help.example.",
        },
      },
      {
        time: "14:05",
        text: {
          tr: "Tarayıcı kaydı: üye sahte sayfaya giriş bilgisi gönderdi. Gerçek üniversite adresi kullanılmadı.",
          en: "Browser record: the member submitted credentials to the fake page, rather than the university website.",
        },
      },
      {
        time: "14:07",
        text: {
          tr: "Sunucu kaydı: aynı hesap bilinmeyen bir cihazdan açıldı; kulup-listesi.csv dışarı indirildi.",
          en: "Server record: the same account logged in from an unfamiliar device and downloaded club-list.csv.",
        },
      },
    ],
    questions: [
      {
        text: {
          tr: "Kanıt hangi giriş yöntemini destekliyor?",
          en: "Which entry method do the records support?",
        },
        options: [
          {
            tr: "Sahte giriş sayfasıyla oltalama",
            en: "Phishing through a fake login page",
          },
          { tr: "Bozuk klavye", en: "A broken keyboard" },
          { tr: "Normal yazılım güncellemesi", en: "A normal software update" },
        ],
        answer: 0,
        why: {
          tr: "Sahte sayfaya bilgi gönderimi ve hemen sonraki yeni cihaz oturumu birbiriyle bağlantılı.",
          en: "The credential submission and subsequent unfamiliar-device session form a linked sequence.",
        },
      },
      {
        text: {
          tr: "İlk uygun müdahale hangisi?",
          en: "Which is an appropriate first response?",
        },
        options: [
          { tr: "Bütün kayıtları silmek", en: "Delete all logs" },
          {
            tr: "Oturumları kapatıp şifreyi yenilemek; kayıtları korumak",
            en: "Revoke sessions, reset the password and preserve logs",
          },
          {
            tr: "Aynı bağlantıyı herkese göndermek",
            en: "Send the same link to everyone",
          },
        ],
        answer: 1,
        why: {
          tr: "Erişimi keserken inceleme için kayıtları korumak gerekir.",
          en: "Contain the access while retaining records for investigation.",
        },
      },
      {
        text: {
          tr: "Verinin dışarı çıktığını hangi kayıt destekler?",
          en: "Which record supports that data was retrieved?",
        },
        options: [
          { tr: "Sadece e-postanın konusu", en: "The email subject alone" },
          { tr: "Klavye düzeni", en: "The keyboard layout" },
          {
            tr: "14:07 dosya indirme kaydı",
            en: "The 14:07 file-download record",
          },
        ],
        answer: 2,
        why: {
          tr: "Dosya indirme kaydı aktarımı destekler; tek başına şüpheli mesaj yeterli değildir.",
          en: "The download record supports data retrieval; a suspicious message alone does not.",
        },
      },
    ],
  },
  {
    title: { tr: "Açık Kalan Laptop", en: "The Unlocked Laptop" },
    brief: {
      tr: "Bu kurgu vakada toplantı sırasında bir dosyanın USB'ye kopyalandığı görülüyor. Cihazın sahibi ile onu kullanan kişiyi aynı varsayma.",
      en: "In this fictional case, a file was copied to a USB drive during a meeting. Do not assume the device owner was the operator.",
    },
    clues: [
      {
        time: "16:10",
        text: {
          tr: "Kartlı geçiş: cihazın sahibi odadan çıktı. Laptop açık ve kilitsiz kaldı.",
          en: "Badge record: the laptop owner left the room. The laptop remained unlocked.",
        },
      },
      {
        time: "16:13",
        text: {
          tr: "Cihaz kaydı: mevcut oturumdan etkinlik.zip açıldı ve USB-04 sürücüsüne kopyalandı.",
          en: "Device record: the active session opened event.zip and copied it to drive USB-04.",
        },
      },
      {
        time: "16:20",
        text: {
          tr: "Kartlı geçiş: cihazın sahibi odaya döndü. Kaydın içinde USB'yi kullanan kişinin kimliği yok.",
          en: "Badge record: the owner returned. The record does not identify who operated the USB drive.",
        },
      },
    ],
    questions: [
      {
        text: {
          tr: "Kesin olarak hangi sonuca varılabilir?",
          en: "Which conclusion is supported?",
        },
        options: [
          { tr: "Dosya USB'ye kopyalanmış", en: "The file was copied to USB" },
          {
            tr: "Dosyayı kesinlikle cihaz sahibi kopyalamış",
            en: "The owner definitely copied the file",
          },
          { tr: "Bütün dosyalar silinmiş", en: "All files were deleted" },
        ],
        answer: 0,
        why: {
          tr: "Kopyalama kaydı aktarımı gösterir, fiziksel kişiyi tek başına belirlemez.",
          en: "The copy record supports the transfer, but does not identify the physical operator.",
        },
      },
      {
        text: {
          tr: "Hangi önlem bu erişimi zorlaştırırdı?",
          en: "Which measure would have made this access harder?",
        },
        options: [
          {
            tr: "Ekranın parlaklığını artırmak",
            en: "Increase screen brightness",
          },
          {
            tr: "Ayrılırken ekranı kilitlemek",
            en: "Lock the screen when leaving",
          },
          { tr: "Dosyayı yeniden adlandırmak", en: "Rename the file" },
        ],
        answer: 1,
        why: {
          tr: "Ekran kilidi, açık oturumun başkası tarafından kullanılmasını zorlaştırır.",
          en: "Screen locking makes unauthorized use of an open session harder.",
        },
      },
      {
        text: {
          tr: "İnceleme için ne korunmalı?",
          en: "What should be preserved for the investigation?",
        },
        options: [
          { tr: "Yalnızca duvar kâğıdı", en: "Only the wallpaper" },
          { tr: "Hiçbir kayıt", en: "No records" },
          {
            tr: "Cihaz, USB ve erişim kayıtları",
            en: "Device, USB and access records",
          },
        ],
        answer: 2,
        why: {
          tr: "Birden fazla bağımsız kayıt, kopyalama zamanı ve fiziksel erişimi karşılaştırmayı sağlar.",
          en: "Independent records allow the copy time and physical access to be compared.",
        },
      },
    ],
  },
];
type Row = {
  id: string;
  owner: string;
  game: "myth-fact" | "digital-detective";
  seed: string;
  progress: string;
  deadline: number;
  completed_at: number | null;
  score: number | null;
};
const shuffled = <T>(values: T[]) => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
function publicView(row: Row, language: "tr" | "en", now: number) {
  const progress = JSON.parse(row.progress) as {
    answers: {
      answer: number | null;
      correct: boolean;
    }[];
  };
  const seed = JSON.parse(row.seed) as {
    order?: number[];
    case?: number;
    options?: number[][];
  };
  const completed = row.completed_at !== null;
  const cursor = progress.answers.length;
  if (row.game === "myth-fact")
    return {
      id: row.id,
      game: row.game,
      deadline: row.deadline,
      serverNow: now,
      completed,
      score:
        row.score ?? progress.answers.filter((a) => a.correct).length * 100,
      cursor,
      count: 5,
      statement:
        !completed && cursor < 5
          ? myths[seed.order![cursor]].statement[language]
          : null,
      reveal: cursor
        ? {
            correct: progress.answers[cursor - 1].correct,
            fact: myths[seed.order![cursor - 1]].fact,
            explanation: myths[seed.order![cursor - 1]].why[language],
          }
        : null,
    };
  const content = cases[seed.case!];
  return {
    id: row.id,
    game: row.game,
    deadline: row.deadline,
    serverNow: now,
    completed,
    score: row.score ?? 0,
    title: content.title[language],
    brief: content.brief[language],
    clues: content.clues.map((c) => ({ time: c.time, text: c.text[language] })),
    questions: content.questions.map((q, i) => ({
      text: q.text[language],
      options: seed.options![i].map((index) => q.options[index][language]),
      ...(completed
        ? {
            correctOption: seed.options![i].indexOf(q.answer),
            explanation: q.why[language],
            correct: progress.answers[i]?.correct ?? false,
          }
        : {}),
    })),
  };
}
export function standGamesRouter(publish: () => void) {
  const router = Router();
  const arena = createArena(db);
  router.use(
    rateLimit({
      windowMs: 60000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  router.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "GET") {
      const origin = req.get("origin"),
        site = req.get("sec-fetch-site");
      let same = !origin;
      try {
        same ||= !!origin && new URL(origin).host === req.get("host");
      } catch {
        /* Reject malformed origin. */
      }
      if (site === "cross-site" || (site !== "same-origin" && !same)) {
        res.status(403).json({ error: "Cross-site request rejected." });
        return;
      }
    }
    next();
  });
  const language = (value: unknown): "tr" | "en" =>
    value === "en" ? "en" : "tr";
  const service = atomicService(db, {
    async owned(id: string, owner: string) {
      const row = (await db
        .prepare("SELECT * FROM stand_attempts WHERE id=? AND owner=?")
        .get(id, owner)) as Row | undefined;
      if (!row)
        throw Object.assign(new Error("Game session not found."), {
          status: 404,
        });
      return row;
    },
    async finish(
      row: Row,
      answers: {
        answer: number | null;
        correct: boolean;
      }[],
    ) {
      const latest = (await db
        .prepare("SELECT * FROM stand_attempts WHERE id=?")
        .get(row.id)) as Row;
      if (latest.completed_at !== null) return latest;
      const score = answers.filter((a) => a.correct).length * 100,
        now = Date.now();
      await db.transaction(async () => {
        await db
          .prepare(
            "UPDATE stand_attempts SET progress=?,score=?,completed_at=? WHERE id=? AND completed_at IS NULL",
          )
          .run(JSON.stringify({ answers }), score, now, row.id);
        await db
          .prepare(
            "UPDATE game_sessions SET score=?,completed_at=?,last_seen_at=? WHERE id=? AND completed_at IS NULL",
          )
          .run(score, now, now, row.id);
      })();
      publish();
      return {
        ...row,
        progress: JSON.stringify({ answers }),
        score,
        completed_at: now,
      };
    },
  });
  router.post("/start", async (req, res) => {
    const input = z
      .object({
        game: z.enum(["myth-fact", "digital-detective"]),
        participantId: z.uuid(),
        nickname: z.string().trim().max(24),
        language: z.enum(["tr", "en"]),
      })
      .parse(req.body);
    if (
      req.session.arenaParticipantId &&
      req.session.arenaParticipantId !== input.participantId
    ) {
      res
        .status(409)
        .json({ error: "Use Next player before changing identity." });
      return;
    }
    req.session.arenaParticipantId = input.participantId;
    req.session.standOwner ??= randomUUID();
    const owner = req.session.standOwner;
    const row = await db.transaction(async () => {
      await db
        .prepare(
          "UPDATE game_sessions SET last_seen_at=0 WHERE id IN (SELECT id FROM stand_attempts WHERE owner=? AND completed_at IS NULL)",
        )
        .run(owner);
      await db
        .prepare(
          "UPDATE stand_attempts SET owner=? WHERE owner=? AND completed_at IS NULL",
        )
        .run(`retired:${randomUUID()}`, owner);
      const id = await arena.start(
          input.participantId,
          input.game,
          input.nickname,
          2,
        ),
        deadline = Date.now() + (input.game === "myth-fact" ? 90000 : 180000),
        seed =
          input.game === "myth-fact"
            ? { order: shuffled(myths.map((_, i) => i)).slice(0, 5) }
            : {
                case: Math.floor(Math.random() * cases.length),
                options: cases[0].questions.map(() => shuffled([0, 1, 2])),
              };
      const row: Row = {
        id,
        owner,
        game: input.game,
        seed: JSON.stringify(seed),
        progress: JSON.stringify({ answers: [] }),
        deadline,
        completed_at: null,
        score: null,
      };
      await db
        .prepare(
          "INSERT INTO stand_attempts(id,owner,game,seed,progress,deadline) VALUES(?,?,?,?,?,?)",
        )
        .run(id, owner, row.game, row.seed, row.progress, deadline);
      return row;
    })();
    req.session.save((error) =>
      error
        ? res.status(500).json({ error: "Session could not be saved." })
        : res.status(201).json(publicView(row, input.language, Date.now())),
    );
  });
  router.get("/:id", async (req, res) => {
    if (!req.session.standOwner) {
      res.status(401).json({ error: "Start a game on this device first." });
      return;
    }
    let row = await service.owned(
      String(req.params.id),
      req.session.standOwner,
    );
    if (row.completed_at === null && Date.now() >= row.deadline)
      row = await service.finish(row, JSON.parse(row.progress).answers);
    res.json(publicView(row, language(req.query.language), Date.now()));
  });
  router.post("/:id/answer", async (req, res) => {
    const input = z
      .object({
        cursor: z.number().int().min(0).max(4),
        answer: z.boolean().nullable(),
        language: z.enum(["tr", "en"]),
      })
      .parse(req.body);
    if (!req.session.standOwner) {
      res.status(401).json({ error: "Start a game on this device first." });
      return;
    }
    const result = await db.transaction(async () => {
      let row = await service.owned(
        String(req.params.id),
        req.session.standOwner!,
      );
      if (row.game !== "myth-fact")
        throw Object.assign(new Error("Wrong game flow."), { status: 400 });
      if (row.completed_at !== null) return row;
      const progress = JSON.parse(row.progress) as {
        answers: {
          answer: number | null;
          correct: boolean;
        }[];
      };
      if (progress.answers.length !== input.cursor)
        throw Object.assign(
          new Error("This statement is no longer accepting answers."),
          { status: 409 },
        );
      if (Date.now() >= row.deadline)
        return service.finish(row, progress.answers);
      const seed = JSON.parse(row.seed) as {
        order: number[];
      };
      progress.answers.push({
        answer: input.answer === null ? null : Number(input.answer),
        correct:
          input.answer !== null &&
          input.answer === myths[seed.order[input.cursor]].fact,
      });
      if (progress.answers.length === 5)
        return service.finish(row, progress.answers);
      row = { ...row, progress: JSON.stringify(progress) };
      await db
        .prepare("UPDATE stand_attempts SET progress=? WHERE id=?")
        .run(row.progress, row.id);
      return row;
    })();
    res.json(publicView(result, input.language, Date.now()));
  });
  router.post("/:id/report", async (req, res) => {
    const input = z
      .object({
        answers: z.array(z.number().int().min(0).max(2).nullable()).length(3),
        language: z.enum(["tr", "en"]),
      })
      .parse(req.body);
    if (!req.session.standOwner) {
      res.status(401).json({ error: "Start a game on this device first." });
      return;
    }
    const result = await db.transaction(async () => {
      const row = await service.owned(
        String(req.params.id),
        req.session.standOwner!,
      );
      if (row.game !== "digital-detective")
        throw Object.assign(new Error("Wrong game flow."), { status: 400 });
      if (row.completed_at !== null) return row;
      const seed = JSON.parse(row.seed) as {
        case: number;
        options: number[][];
      };
      const answers = cases[seed.case].questions.map((q, i) => ({
        answer: input.answers[i],
        correct:
          Date.now() < row.deadline &&
          input.answers[i] !== null &&
          seed.options[i][input.answers[i]!] === q.answer,
      }));
      return service.finish(row, answers);
    })();
    res.json(publicView(result, input.language, Date.now()));
  });
  router.use(
    (
      error: unknown,
      _req: unknown,
      res: import("express").Response,
      _next: unknown,
    ) => {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid game input." });
        return;
      }
      const cause = error as {
        status?: number;
      };
      res
        .status(cause.status ?? 500)
        .json({
          error: cause.status
            ? (error as Error).message
            : "The game could not save your answer. Please retry.",
        });
    },
  );
  return router;
}

import type { CvDocument, CoverLetterDocument, DocumentFormat, UserProfile } from "@/types/documents";
import { getContactPhone } from "@/lib/documents/profile";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import { prepareHtml2CanvasClone, inlineExportStyles } from "@/lib/export/html2canvas-compat";

function cvToPlainText(data: CvDocument, profile: UserProfile): string {
  const contactPhone = getContactPhone(profile);
  const contact = [
    profile.email,
    contactPhone,
    profile.location,
    profile.linkedinUrl,
    profile.website,
    profile.githubUrl,
    profile.extraLink,
  ]
    .filter(Boolean)
    .join(" | ");

  const lines = [
    profile.fullName,
    profile.targetRole,
    contact,
    profile.languages && `Languages: ${profile.languages}`,
    "",
    "SUMMARY",
    data.summary,
    "",
    "EXPERIENCE",
    ...data.experience.flatMap((e) => [
      `${e.role} — ${e.company} (${e.period})`,
      ...e.highlights.map((h) => `  • ${h}`),
      "",
    ]),
    "SKILLS",
    data.skills.join(", "),
    "",
    "EDUCATION",
    data.education,
  ];
  return lines.filter((l) => l !== undefined).join("\n");
}

function coverToPlainText(data: CoverLetterDocument, profile: UserProfile): string {
  return [
    profile.fullName,
    profile.email,
    getContactPhone(profile),
    "",
    data.date,
    "",
    data.greeting,
    "",
    ...data.paragraphs,
    "",
    data.closing,
  ].join("\n");
}

export async function downloadAsTxt(
  content: string,
  filename: string
): Promise<void> {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${filename}.txt`);
}

export async function downloadAsPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const exportRoot = element.cloneNode(true) as HTMLElement;
  exportRoot.setAttribute("data-pdf-export", "true");
  exportRoot.style.position = "fixed";
  exportRoot.style.left = "-10000px";
  exportRoot.style.top = "0";
  exportRoot.style.zIndex = "-1";
  document.body.appendChild(exportRoot);

  try {
    inlineExportStyles(element, exportRoot);

    const canvas = await html2canvas(exportRoot, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (clonedDocument, clonedElement) => {
        prepareHtml2CanvasClone(clonedDocument, exportRoot, clonedElement);
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    exportRoot.remove();
  }
}

export async function downloadCvAsDocx(
  data: CvDocument,
  profile: UserProfile,
  filename: string
): Promise<void> {
  const children = [
    new Paragraph({
      children: [new TextRun({ text: profile.fullName, bold: true, size: 32 })],
    }),
    new Paragraph({ children: [new TextRun({ text: profile.targetRole, size: 24 })] }),
    new Paragraph({
      children: [
        new TextRun({
          text: [profile.email, getContactPhone(profile), profile.location].filter(Boolean).join(" · "),
          size: 20,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Summary")] }),
    new Paragraph({ children: [new TextRun(data.summary)] }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Experience")] }),
    ...data.experience.flatMap((exp) => [
      new Paragraph({
        children: [
          new TextRun({ text: `${exp.role} — ${exp.company}`, bold: true }),
          new TextRun({ text: ` (${exp.period})` }),
        ],
      }),
      ...exp.highlights.map(
        (h) =>
          new Paragraph({
            children: [new TextRun({ text: `• ${h}` })],
            indent: { left: 360 },
          })
      ),
    ]),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Skills")] }),
    new Paragraph({ children: [new TextRun(data.skills.join(", "))] }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Education")] }),
    new Paragraph({ children: [new TextRun(data.education)] }),
  ];

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

export async function downloadCoverAsDocx(
  data: CoverLetterDocument,
  profile: UserProfile,
  filename: string
): Promise<void> {
  const children = [
    new Paragraph({ children: [new TextRun({ text: profile.fullName, bold: true })] }),
    new Paragraph({ children: [new TextRun(profile.email)] }),
    new Paragraph({ children: [new TextRun(data.date)] }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: data.greeting, bold: true })] }),
    ...data.paragraphs.map(
      (p) =>
        new Paragraph({
          children: [new TextRun(p)],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        })
    ),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun(data.closing)] }),
  ];

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

export async function downloadDocument(
  format: DocumentFormat,
  type: "cv" | "cover_letter",
  data: CvDocument | CoverLetterDocument,
  profile: UserProfile,
  previewElement: HTMLElement | null,
  baseFilename: string
): Promise<void> {
  if (format === "txt") {
    const text =
      type === "cv"
        ? cvToPlainText(data as CvDocument, profile)
        : coverToPlainText(data as CoverLetterDocument, profile);
    await downloadAsTxt(text, baseFilename);
    return;
  }

  if (format === "pdf") {
    if (!previewElement) throw new Error("Preview not ready");
    await downloadAsPdf(previewElement, baseFilename);
    return;
  }

  if (type === "cv") {
    await downloadCvAsDocx(data as CvDocument, profile, baseFilename);
  } else {
    await downloadCoverAsDocx(data as CoverLetterDocument, profile, baseFilename);
  }
}

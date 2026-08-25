/**
 * Growth FormAssist - Rater TXT Parser
 *
 * Parses the TXT format produced by the insurance rater form.
 *
 * The parser intentionally preserves:
 * - section titles
 * - source field labels
 * - repeating instances
 * - source values
 *
 * It does NOT perform canonical-field mapping.
 */

import type {
  SourceData,
  SourceValue,
  SourceParseResponse,
} from './types';

const EXPORT_HEADER =
  '=== INSURANCE RATER FORM EXPORT ===';

interface ParsedSection {
  title: string;
  fields: Record<string, SourceValue>;
  instances: Array<Record<string, SourceValue>>;
  isRepeatable: boolean;
}

function normalizeSectionTitle(
  title: string,
): string {
  return title
    .trim()
    .replace(/^\[\s*/, '')
    .replace(/\s*\]$/, '')
    .trim();
}

function normalizeFieldLabel(
  label: string,
): string {
  return label.trim();
}

function parseScalar(
  value: string,
): SourceValue {
  const normalized = value.trim();

  if (normalized === '') {
    return '';
  }

  if (normalized === 'Yes') {
    return true;
  }

  if (normalized === 'No') {
    return false;
  }

  return normalized;
}

function parseFieldLine(
  line: string,
): {
  label: string;
  value: SourceValue;
} | null {
  const separatorIndex = line.indexOf(':');

  if (separatorIndex < 0) {
    return null;
  }

  const label = normalizeFieldLabel(
    line.slice(0, separatorIndex),
  );

  if (!label) {
    return null;
  }

  const value = parseScalar(
    line.slice(separatorIndex + 1),
  );

  return {
    label,
    value,
  };
}

function isSectionHeader(
  line: string,
): boolean {
  return (
    line.trim().startsWith('[') &&
    line.trim().endsWith(']')
  );
}

function isInstanceHeader(
  line: string,
): boolean {
  return /^\s*Instance\s+\d+\s*:\s*$/i.test(
    line,
  );
}

/**
 * Parse the insurance rater TXT export.
 */
export function parseRaterTxt(
  text: string,
): SourceParseResponse {
  if (!text || !text.trim()) {
    return {
      success: false,
      error: 'The imported file is empty.',
    };
  }

  const normalizedText = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = normalizedText.split('\n');

  const firstMeaningfulLine = lines.find(
    (line) => line.trim().length > 0,
  );

  if (
    firstMeaningfulLine?.trim() !==
    EXPORT_HEADER
  ) {
    return {
      success: false,
      error:
        'The file does not appear to be an Insurance Rater TXT export.',
    };
  }

  const sections: ParsedSection[] = [];

  let currentSection:
    | ParsedSection
    | undefined;

  let currentInstance:
    | Record<string, SourceValue>
    | undefined;

  for (let index = 1; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      continue;
    }

    if (isSectionHeader(line)) {
      const title = normalizeSectionTitle(
        line.trim(),
      );

      currentSection = {
        title,
        fields: {},
        instances: [],
        isRepeatable: false,
      };

      sections.push(currentSection);
      currentInstance = undefined;

      continue;
    }

    if (!currentSection) {
      continue;
    }

    if (isInstanceHeader(line)) {
      currentSection.isRepeatable = true;

      currentInstance = {};

      currentSection.instances.push(
        currentInstance,
      );

      continue;
    }

    const parsed = parseFieldLine(line);

    if (!parsed) {
      continue;
    }

    if (currentInstance) {
      currentInstance[parsed.label] =
        parsed.value;
    } else {
      currentSection.fields[parsed.label] =
        parsed.value;
    }
  }

  if (sections.length === 0) {
    return {
      success: false,
      error:
        'No form sections were found in the imported TXT file.',
    };
  }

  const source: SourceData = {};

  for (const section of sections) {
    if (section.isRepeatable) {
      source[section.title] =
        section.instances;
    } else {
      source[section.title] =
        section.fields;
    }
  }

  return {
    success: true,
    source,
  };
}

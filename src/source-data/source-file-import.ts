/**
 * Growth FormAssist - Source File Import
 *
 * Browser-facing boundary for importing source-data files.
 *
 * This module handles File objects only.
 * The actual TXT parsing and normalization remain inside
 * the source-data import pipeline.
 */

import type {
  SourceImportResult,
} from './import-pipeline';

import type {
  SourceFieldCatalog,
} from './field-catalog';

import {
  importRaterSourceText,
} from './import-pipeline';

const MAX_SOURCE_FILE_SIZE =
  5 * 1024 * 1024;

/**
 * Import a Rater TXT file.
 *
 * File handling is deliberately kept outside the parser
 * and normalization layers.
 */
export async function importRaterTxtFile(
  file: File,
  catalog: SourceFieldCatalog,
): Promise<SourceImportResult> {
  if (file.size > MAX_SOURCE_FILE_SIZE) {
    return createFileImportError(
      'Source file is larger than the 5 MB limit.',
    );
  }

  const text = await file.text();

  if (text.trim().length === 0) {
    return createFileImportError(
      'Source file is empty.',
    );
  }

  return importRaterSourceText(
    text,
    catalog,
  );
}

function createFileImportError(
  error: string,
): SourceImportResult {
  return {
    success: false,
    sourceSystem: 'rater',
    status: 'error',
    data: {
      fields: [],
    },
    unmapped: [],
    warnings: [],
    summary: {
      totalResolvedFields: 0,
      mappedFields: 0,
      unmappedFields: 0,
      warningCount: 0,
    },
    error,
  };
}


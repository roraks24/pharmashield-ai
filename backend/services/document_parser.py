"""Service for parsing uploaded complaint documents."""
import io
import PyPDF2
from fastapi import UploadFile, HTTPException
import logging

logger = logging.getLogger(__name__)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB per GMP document upload guidelines


async def parse_document(file: UploadFile) -> str:
    """Extract text from supported document types (.txt, .pdf).

    Validates file size (max 10MB) and format to guard against memory exhaustion.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename.")

    filename = file.filename.lower()
    if not (filename.endswith(".txt") or filename.endswith(".pdf")):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: '{file.filename}'. Please upload .txt or .pdf files.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    try:
        if filename.endswith(".txt"):
            return content.decode("utf-8")

        # PDF extraction via PyPDF2
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        extracted_pages = []
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_pages.append(page_text)
        return "\n".join(extracted_pages).strip()

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Text file must be valid UTF-8 encoded.")
    except PyPDF2.errors.PdfReadError as err:
        logger.warning("Corrupt PDF file uploaded: %s (%s)", filename, err)
        raise HTTPException(status_code=400, detail=f"Failed to read PDF file (possibly corrupt): {err}")
    except Exception as exc:
        logger.error("Unexpected error parsing document %s: %s", filename, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Internal error processing document: {exc}",
        )


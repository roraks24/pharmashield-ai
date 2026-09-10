"""Service for parsing uploaded documents."""
import io
import PyPDF2
from fastapi import UploadFile, HTTPException
import logging

logger = logging.getLogger(__name__)

async def parse_document(file: UploadFile) -> str:
    """Extract text from supported document types."""
    content = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.txt'):
            return content.decode('utf-8')
            
        elif filename.endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
            
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format: {filename}. Please upload .txt or .pdf files."
            )
    except Exception as e:
        logger.error(f"Error parsing document {filename}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing document: {str(e)}"
        )

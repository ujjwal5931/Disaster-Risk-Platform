from fastapi import APIRouter, UploadFile, File
from app.models.schemas import BaseResponse
import io

REQUIRED_COLUMNS = [
    "name", "latitude", "longitude", "population",
    "district", "state", "hazard_type", "hazard_severity",
    "housing_quality", "road_accessibility",
]

router = APIRouter()


@router.post("/", response_model=BaseResponse)
async def upload_data(file: UploadFile = File(...)):
    if not file.filename:
        return BaseResponse(success=False, message="No file uploaded")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ("csv", "json", "geojson"):
        return BaseResponse(
            success=False,
            message=f"Unsupported file type '{ext}'. Supported: CSV, JSON, GeoJSON"
        )

    content = await file.read()
    errors = []
    preview_rows = []
    total_rows = 0

    if ext == "csv":
        try:
            text = content.decode("utf-8")
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            if not lines:
                return BaseResponse(success=False, message="CSV file is empty")
            headers = [h.strip().lower() for h in lines[0].split(",")]
            missing = [c for c in REQUIRED_COLUMNS if c not in headers]
            if missing:
                errors.append(f"Missing required columns: {', '.join(missing)}")
            total_rows = len(lines) - 1
            for i, line in enumerate(lines[1:6], start=2):
                row_dict = dict(zip(headers, [v.strip() for v in line.split(",")]))
                preview_rows.append(row_dict)
                if not row_dict.get("name"):
                    errors.append(f"Row {i}: Missing name")
                try:
                    lat = float(row_dict.get("latitude", ""))
                    if not (6 <= lat <= 37):
                        errors.append(f"Row {i}: Latitude {lat} outside India bounds (6–37°N)")
                except ValueError:
                    errors.append(f"Row {i}: Invalid latitude value")
                try:
                    lon = float(row_dict.get("longitude", ""))
                    if not (68 <= lon <= 98):
                        errors.append(f"Row {i}: Longitude {lon} outside India bounds (68–98°E)")
                except ValueError:
                    errors.append(f"Row {i}: Invalid longitude value")
        except Exception as e:
            return BaseResponse(success=False, message=f"CSV parse error: {str(e)}")

    return BaseResponse(data={
        "filename": file.filename,
        "total_rows": total_rows,
        "preview": preview_rows,
        "errors": errors,
        "valid": len(errors) == 0,
        "message": "File validated successfully. Review data before importing." if not errors else f"{len(errors)} validation error(s) found.",
        "required_columns": REQUIRED_COLUMNS,
    })

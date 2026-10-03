export function orderPhotos(photos, photoIds) {
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  const ordered = photoIds.map((id) => byId.get(id)).filter(Boolean);
  const knownIds = new Set(photoIds);
  return [...ordered, ...photos.filter((photo) => !knownIds.has(photo.id))];
}

export function movePhoto(photoIds, sourceId, targetId) {
  const sourceIndex = photoIds.indexOf(sourceId);
  const targetIndex = photoIds.indexOf(targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return photoIds;
  const reordered = [...photoIds];
  reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, sourceId);
  return reordered;
}

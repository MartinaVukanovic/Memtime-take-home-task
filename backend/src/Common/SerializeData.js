function iso(value) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function formatResourceId(doc) {
  if (!doc?._id) {
    return undefined;
  }
  
  return typeof doc._id === 'string' ? doc._id : String(doc._id);
}

export function serializeClient(doc) {
  return {
    id: formatResourceId(doc),
    name: doc.name,
    description: doc.description,
    status: doc.status,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function serializeProject(doc) {
  return {
    id: formatResourceId(doc),
    clientId: doc.clientId,
    name: doc.name,
    status: doc.status,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function serializeTask(doc) {
  return {
    id: formatResourceId(doc),
    parent: doc.parent ?? 0,
    name: doc.name,
    status: doc.status,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function serializeTimeEntry(doc) {
  return {
    id: formatResourceId(doc),
    taskId: doc.taskId,
    userId: doc.userId,
    comment: doc.comment,
    start: iso(doc.start),
    end: iso(doc.end),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

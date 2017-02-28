nuke.operation = 'DELETE';
function nuke() {
  // Doesn't do anything
  // But because of the invalidates and invalidatesOn
  // It will nuke the Hackernews Cache
  return Promise.resolve();
}

export {
  nuke,
}
// Retorna o ícone Material Symbols apropriado para um arquivo, baseado na extensão
export function getIconForFile(name){
  const parts = name.split('.');
  if(parts.length === 1) return 'insert_drive_file';
  const ext = parts.pop().toLowerCase();
  switch(ext){
    case 'js': return 'code';
    case 'ts': return 'code';
    case 'html': return 'html';
    case 'css': return 'style';
    case 'json': return 'data_object';
    case 'md': return 'description';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif': return 'image';
    case 'svg': return 'image';
    case 'pdf': return 'picture_as_pdf';
    case 'zip':
    case 'tar':
    case 'gz': return 'folder_zip';
    default: return 'insert_drive_file';
  }
}

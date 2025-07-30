/* eslint-disable @typescript-eslint/no-explicit-any */
const exportExcel = (dataArray: any[], filename = 'Fichier') => {
  import('xlsx').then((xlsx) => {
    const worksheet = xlsx.utils.json_to_sheet(dataArray);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = xlsx.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    saveAsExcelFile(excelBuffer, filename);
  });
};

const saveAsExcelFile = (buffer: any, fileName: string) => {
  import('file-saver').then((module) => {
    if (module && module.default) {
      const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
      const EXCEL_EXTENSION = '.xlsx';
      const data = new Blob([buffer], {
        type: EXCEL_TYPE,
      });

      module.default(data, `${fileName}_export_${new Date().getTime()}${EXCEL_EXTENSION}`);
    }
  });
};

const ExcelExportService = exportExcel;

export default ExcelExportService;
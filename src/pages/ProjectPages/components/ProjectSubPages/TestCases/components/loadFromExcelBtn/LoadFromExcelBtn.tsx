import { QuestionDialog } from '@components/'
import { useTestCase } from '@contexts/'
import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import styles from './LoadFromExcelBtn.module.scss'

const columns = { 
  "field1": '', 
  "field2": '', 
  "field3": '',
  "field4": '', 
  "field5": '', 
  "field6": '',
  "field7": '', 
  "field8": '', 
  "field9": '',
 }

export const LoadFromExcelBtn: React.FC<{
  projectId: number
  className?: string
}> = ({ projectId, className = '' }) => {
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMap, setColumnMap] = useState<{ [key: string]: string }>(columns)
  const [file, setFile] = useState<File | null>(null)
  const [openDiag, setOpenDiag] = useState(false)
  const [fileName, setFileName] = useState('')
  const { sendExcelFile } = useTestCase()

  const inputRef = useRef<HTMLInputElement>(null)

  const handleLoadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFile(file)
    setFileName(file.name)

    try {
      const headers = await readFirstRow(file)
      setHeaders(headers)

      setColumnMap((columnMap) => {
        Object.keys(columnMap).forEach(
          (key, index) =>
            (columnMap[key] = index < headers.length ? headers[index] : '')
        )
        return { ...columnMap }
      })
      setOpenDiag(true)
    } catch (error) {
      toast.error(`Ошибка чтения файла: ${error}`, {
        position: 'top-center',
      })
      console.error('Error reading file:', error)
      throw error
    }
  }

  const readFirstRow = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)

          const workbook = XLSX.read(data, {
            type: 'array',
            sheetRows: 1,
            cellDates: false,
            cellNF: false,
            cellText: false,
          })

          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false,
          }) as any[][]

          const firstRow = jsonData[0] || []
          const headers = firstRow
            .map((cell) =>
              cell !== undefined && cell !== null ? String(cell).trim() : ''
            )
            .filter((header) => header !== '')

          resolve(headers)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  const handleSave = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', fileName)
    formData.append('columnMap', JSON.stringify(columnMap))

    try {
      await sendExcelFile(file, fileName, columnMap, projectId)
      toast.info(`Файл ${fileName} отправлен на загрузку`, {
        position: 'top-center',
      })
      handleClose()
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(`Не удалось отправить файл: ${error}`, {
        position: 'top-center',
      })
    }
  }

  const handleClose = () => {
    setOpenDiag(false)
    setFile(null)
    setHeaders([])
    setColumnMap(columns)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <div className={`${styles.inputDiv} ${className}`}>
        <input
          ref={inputRef}
          type="file"
          id='excel_input'
          accept=".xls, .xlsx"
          onChange={handleLoadFile}
        />
        <label htmlFor="excel_input"> {file ? "Еще чуть-чуть" : "Импорт тест-кейсов"}</label>
      </div>
      <QuestionDialog
        showQuestion={openDiag}
        changeShowQuestion={setOpenDiag}
        onYesClick={handleSave}
        onNoClick={handleClose}
        closeOnClick={false}
        YesBtnText="Отправить"
        NoBtnText="Отменить"
      >
        <div className={styles.dialogContent}>
          <p>
            Пожалуйста, поставьте в соответствие столбцы из вашего файла с
            необходимым форматом:
          </p>
          {Object.keys(columnMap).map((column) => (
            <div key={column} className={styles.columnMapping}>
              <label htmlFor={`column_${column}`}>{column}</label>
              <select
                name={`column_${column}`}
                id={`column_${column}`}
                className={styles.select}
                value={columnMap[column]}
                onChange={(e) => {
                  const value = e.currentTarget.value

                  setColumnMap((map) => ({
                    ...map,
                    [column]: value,
                  }))
                }}
              >
                <option value="">нет</option>
                {headers.map((header) => (
                  <option
                    key={header}
                    value={header}
                    disabled={
                      Object.values(columnMap).includes(header) &&
                      columnMap[column] !== header
                    }
                  >
                    {header}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </QuestionDialog>
    </>
  )
}

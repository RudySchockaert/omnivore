import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import { Toaster } from 'react-hot-toast'

import { showErrorToast, showSuccessToast } from '../../../lib/toastHelpers'
import { applyStoredTheme } from '../../../lib/themeUpdater'

import {
  Box,
  HStack,
  VStack,
} from '../../../components/elements/LayoutPrimitives'

import 'antd/dist/antd.compact.css'
import { StyledText } from '../../../components/elements/StyledText'
import { ProfileLayout } from '../../../components/templates/ProfileLayout'
import {
  uploadImportFileRequestMutation,
  UploadImportFileType,
} from '../../../lib/networking/mutations/uploadImportFileMutation'
import { Button } from '../../../components/elements/Button'
import Dropzone, { useDropzone } from 'react-dropzone'

import { SyncLoader } from 'react-spinners'
import { theme } from '../../../components/tokens/stitches.config'
import { Tray } from 'phosphor-react'

type UploadState = 'none' | 'uploading' | 'completed'

export default function ImportUploader(): JSX.Element {
  applyStoredTheme(false)

  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [file, setFile] = useState<File>()
  const [type, setType] = useState<UploadImportFileType>()
  const [uploadState, setUploadState] = useState<UploadState>('none')
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone()

  const onDropAccepted = async (acceptedFiles: File[]) => {
    const contentType = 'application/zip'
    const file = acceptedFiles.find(() => true)
    if (!file) {
      setErrorMessage('No file selected.')
      return
    }

    setUploadState('uploading')

    try {
      const result = await uploadImportFileRequestMutation(
        UploadImportFileType.MATTER,
        contentType
      )

      if (result && result.uploadSignedUrl) {
        const uploadRes = await fetch(result.uploadSignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'content-type': contentType,
            'content-length': `${file.size}`,
          },
        })
        setUploadState('completed')
      } else {
        setErrorMessage(
          'Unable to create file upload. Please ensure you are logged in.'
        )
        setUploadState('none')
      }
    } catch (error) {
      console.log('caught error', error)
      if (error == 'UPLOAD_DAILY_LIMIT_EXCEEDED') {
        setErrorMessage('You have exceeded your maximum daily upload limit.')
      }
      setUploadState('none')
    }
  }

  return (
    <ProfileLayout>
      <VStack
        alignment="start"
        css={{
          padding: '16px',
          background: 'white',
          minWidth: '340px',
          width: '70vw',
          maxWidth: '576px',
          borderRadius: '8px',
          border: '1px solid #3D3D3D',
          boxShadow: '#B1B1B1 9px 9px 9px -9px',
        }}
      >
        <StyledText
          style="modalHeadline"
          css={{
            color: theme.colors.omnivoreGray.toString(),
          }}
        >
          Import Matter Archive
        </StyledText>
        <StyledText
          style="caption"
          css={{ pt: '10px', color: theme.colors.omnivoreGray.toString() }}
        >
          Omnivore supports uploading the Archive.zip file generated by
          exporting your data from the Matter app.
        </StyledText>
        <StyledText
          style="caption"
          css={{ color: theme.colors.omnivoreGray.toString() }}
        >
          To export your data from Matter, go to My Account, and choose Export
          data, this will send you an email with your data in a file
          Archive.zip. Upload that file using the uploader on this page.
        </StyledText>
        <StyledText
          style="caption"
          css={{ color: theme.colors.omnivoreGray.toString() }}
        >
          <a href="https://docs.omnivore.app/using/importing.html#importing-data-from-matter">
            More info
          </a>
        </StyledText>
        <StyledText
          style="caption"
          css={{ pt: '20px', color: theme.colors.omnivoreGray.toString() }}
        >
          <b>Note:</b> Please note you are limited to three import uploads per a
          day, and the maximum file size is 10MB.
        </StyledText>
        <VStack css={{ pt: '36px', width: '100%' }}>
          {uploadState == 'completed' ? (
            <StyledText
              style="caption"
              css={{
                pt: '10px',
                pb: '20px',
                color: theme.colors.omnivoreGray.toString(),
              }}
            >
              Your upload has completed. Please note that it can take some time
              for your library to be updated. You will be sent an email when the
              process completes.
            </StyledText>
          ) : (
            <>
              <Box css={{ width: '100%' }}>
                <Dropzone
                  accept={{ 'application/zip': ['.zip'] }}
                  multiple={false}
                  maxSize={1e7}
                  onDropAccepted={onDropAccepted}
                  disabled={uploadState == 'uploading'}
                >
                  {({ getRootProps, getInputProps }) => (
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                      <VStack
                        alignment="center"
                        css={{
                          borderRadius: '8px',
                          border: '1px dashed #d9d9d9',
                          minHeight: '64px',
                          mb: '10px',
                          pt: '10px',
                        }}
                      >
                        {uploadState == 'uploading' ? (
                          <SyncLoader
                            color={theme.colors.omnivoreGray.toString()}
                            size={8}
                          />
                        ) : (
                          <>
                            <Tray
                              size={34}
                              color={theme.colors.omnivoreGray.toString()}
                            />
                            <StyledText
                              style="caption"
                              css={{
                                pt: '10px',
                                color: theme.colors.omnivoreGray.toString(),
                              }}
                            >
                              Click or Drag Archive.zip file here to upload
                            </StyledText>
                          </>
                        )}
                      </VStack>
                    </div>
                  )}
                </Dropzone>
              </Box>
            </>
          )}

          {uploadState == 'completed' && (
            <VStack css={{ width: '100%' }} alignment="center">
              <Button
                onClick={(e) => {
                  window.location.href = '/home'
                  e.preventDefault()
                }}
                style="ctaDarkYellow"
              >
                Return to Library
              </Button>
            </VStack>
          )}

          {errorMessage && (
            <StyledText style="error">{errorMessage}</StyledText>
          )}
        </VStack>
      </VStack>
    </ProfileLayout>
  )
}

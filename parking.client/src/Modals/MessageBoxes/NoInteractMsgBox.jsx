import { useMessageBox } from '../../NoInteractMsgBoxProvider';
import Modal from '../../controls/Modal';

function NoInteractMsgBox() {

    const { show, isSubmitting, message, title, closeMessageBox } = useMessageBox();

  return (
      <Modal
          show={show}
          title={title}
          onClose={closeMessageBox}
          preventCloseOnSubmit={true}
          isSubmitting={isSubmitting}
      >
          <p>{message}</p>
      </Modal>
  );
}

export default NoInteractMsgBox;
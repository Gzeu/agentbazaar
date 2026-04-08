#![no_std]

multiversx_sc::imports!();

use crate::storage::{StorageModule, TaskRecord, TaskStatus};

#[multiversx_sc::module]
pub trait ViewsModule: StorageModule {
    #[view(getTask)]
    fn get_task(&self, task_id: ManagedBuffer) -> OptionalValue<TaskRecord<Self::Api>> {
        match self.tasks().get(&task_id) {
            Some(r) => OptionalValue::Some(r),
            None => OptionalValue::None,
        }
    }

    #[view(getTaskStatus)]
    fn get_task_status(&self, task_id: ManagedBuffer) -> OptionalValue<TaskStatus> {
        match self.tasks().get(&task_id) {
            Some(r) => OptionalValue::Some(r.status),
            None => OptionalValue::None,
        }
    }

    #[view(taskExists)]
    fn task_exists(&self, task_id: ManagedBuffer) -> bool {
        self.tasks().contains_key(&task_id)
    }
}

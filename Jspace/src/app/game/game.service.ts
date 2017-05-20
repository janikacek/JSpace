import {Injectable} from '@angular/core';
import {TasksService} from "../tasks/tasks.service";
import {Task} from "app/tasks/task";
import {AceInputComponent} from "../ace-input/ace-input.component";
import {AceOutputComponent} from "../ace-output/ace-output.component";
import {AnalyseCodeService} from '../analyze-code/analyze.code-service'

/**
 * GameService controls the game progress:
 * - creates new game
 * - shows task instructions in output editor
 * - gets code from input editor
 * - sends the code to validation
 * - gets the answer from validation
 * - and shows the answer in output editor, if the answer is correct gameService enables next button and shows
 *   instructions of next task
 */

@Injectable()
export class GameService {

  currentTask: Task;
  currentTaskNumber: number;
  aceInput: AceInputComponent;
  aceOutput: AceOutputComponent;
  btnNextDisabled: boolean;

  constructor(private tasksService: TasksService,
              private analyseCodeService: AnalyseCodeService,) {
    console.log("game service injected")
  }

  newGame(aceIn: AceInputComponent, aceOut: AceOutputComponent) {
    console.log('creating new game...');
    this.aceInput = aceIn;
    this.aceOutput = aceOut;
    this.currentTaskNumber = 0;
    this.currentTask = this.tasksService.getTask(this.currentTaskNumber);
    console.log('current task', this.currentTask);
    this.aceOutput.setEditorValue(this.currentTask.getInstruction());
    this.aceInput.clearEditor();
    this.btnNextDisabled = true;
    console.log('new game created');
  }

  validateCode() {
    let textFromInput: string = this.aceInput.getStringFromEditor();
    if (textFromInput.length === 0) {
      this.aceOutput.setEditorValue("You forgot to type something :)")
    } else {
      this.analyseCodeService.getTokenizedCode(textFromInput).subscribe(
        data => {
          let testPassed = this.currentTask.testTask(data);
          if (testPassed) {
            this.aceOutput.setEditorValue(this.currentTask.getMessageCorrect());
            this.btnNextDisabled = false;
          } else {
            this.aceOutput.setEditorValue(this.currentTask.getMessageWrong());
          }
        });
    }
  }

  goToNextTask() {
    this.currentTaskNumber++;
    if (this.currentTaskNumber == this.tasksService.getNumberOfAllTasks()) {
      this.aceOutput.setEditorValue("GAME OVER");
      this.aceInput.clearEditor();
      this.btnNextDisabled = true;
    }
    else {
      this.currentTask = this.tasksService.getTask(this.currentTaskNumber);
      this.aceOutput.setEditorValue(this.currentTask.getInstruction());
      this.aceInput.clearEditor();
      this.btnNextDisabled = true;
    }
    console.log("current task", this.currentTask);
  }
}
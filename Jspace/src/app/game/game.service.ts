import { Injectable } from '@angular/core';
import { TasksService } from '../tasks/tasks.service';
import { Task } from 'app/tasks/task';
import { AceInputComponent } from '../ace-input/ace-input.component';
import { AceOutputComponent } from '../ace-output/ace-output.component';
import { AnalyseCodeService } from '../analyze-code/analyze.code-service'
import { MentorComponent } from '../mentor/mentor.component';
import { LocalStorageService } from '../storage/local.storage-service';
import { DBDataService } from '../database-helper/database.data-service';

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

  currentTaskNumber: number;
  currentTask: Task;
  completeTries: number
  mentor: MentorComponent;
  aceInput: AceInputComponent;
  aceOutput: AceOutputComponent;
  btnNextHidden: boolean;
  btnRunHidden: boolean;

  private localStorageService = LocalStorageService.getInstance();

  constructor(private tasksService: TasksService,
    private analyseCodeService: AnalyseCodeService,
    private dBDDataService: DBDataService) {
    console.log("game service injected")
  }

  newGame(mentor: MentorComponent, aceIn: AceInputComponent, aceOut: AceOutputComponent) {
    console.log('creating new game...');

    if (this.localStorageService.readLocalStorage('player') != undefined) {
      let player = JSON.parse(this.localStorageService.readLocalStorage('player'));
      console.log("Saved player: " + JSON.stringify(player));
      this.currentTaskNumber = player['task'];
      this.completeTries = player['completeTries'];
    } else {
      console.log("new game starting...")
      this.currentTaskNumber = 0;
      this.completeTries = 0;
    }
    this.currentTask = this.tasksService.getTask(this.currentTaskNumber);
    console.log('current task', this.currentTask);
    this.mentor = mentor;
    this.aceInput = aceIn;
    this.aceOutput = aceOut;
    this.btnNextHidden = true;
    this.btnRunHidden = false;

    this.aceInput.setEditorFocus();
    this.mentor.setMentorText(this.currentTask.getMentorText());
    this.aceOutput.setEditorValue(this.currentTask.getInstruction());
    this.aceInput.clearEditor();

    console.log('new game created');
  }

  validateCode() {
    let textFromInput: string = this.aceInput.getStringFromEditor().trim();
    if (textFromInput.length === 0) {
      this.aceOutput.setEditorValue('You forgot to type something :)')
    } else {
      this.analyseCodeService.getTokenizedCode(textFromInput).subscribe(
        data => {
          let testPassed = this.currentTask.testTask(data);
          if (testPassed) {
            this.mentor.setMentorText(this.currentTask.getMentorAnswerCorrect());
            this.mentor.setImgSuccess();
            this.aceOutput.setEditorValue(this.currentTask.getMessageCorrect());
            this.btnNextHidden = false;
            this.btnRunHidden = true;
          } else {
            this.mentor.setMentorText(this.currentTask.getMentorAnswerWrong());
            this.mentor.setImgFailure();
            this.aceOutput.setEditorValue(this.currentTask.getMessageWrong());
          }
          this.completeTries = this.completeTries + 1;
          let player = JSON.parse(this.localStorageService.readLocalStorage('player'));
          player.completeTries = this.completeTries;
          this.localStorageService.saveToLocalStorage('player', player);
          this.dBDDataService.addPlayerToHighscores(player).subscribe();
        });
    }
  }

  goToNextTask() {
    this.currentTaskNumber++;

    if (this.currentTaskNumber == this.tasksService.getNumberOfAllTasks()) {
      this.btnRunHidden = true;
      this.btnNextHidden = true;
      this.mentor.setMentorText('Good bye, old friend. May the Force be with you.');
      this.aceOutput.setEditorValue('GAME OVER');
      this.dBDDataService.getUserHighscoreData().subscribe(data => this.aceOutput.setEditorValue(JSON.stringify(data, null, "\t")));
      this.localStorageService.resetLocalStorace();
    }
    else {
      this.aceInput.setEditorFocus();
      this.currentTask = this.tasksService.getTask(this.currentTaskNumber);
      this.mentor.setMentorText(this.currentTask.getMentorText());
      this.aceOutput.setEditorValue(this.currentTask.getInstruction());
      this.btnRunHidden = false;
      this.btnNextHidden = true;
    }
    this.mentor.setImgMentor();
    this.aceInput.clearEditor();

    console.log('current task', this.currentTask);
  }
}

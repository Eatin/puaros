import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';

/**
 * Git operations service using simple-git
 */
export class GitService {
    private readonly git: SimpleGit;

    constructor(baseDir: string, options?: Partial<SimpleGitOptions>) {
        this.git = simpleGit(baseDir, options);
    }

    public async clone(repoUrl: string, localPath: string): Promise<void> {
        await this.git.clone(repoUrl, localPath);
    }

    public async status(): Promise<string> {
        const statusSummary = await this.git.status();
        return JSON.stringify(statusSummary, null, 2);
    }

    public async log(maxCount: number = 10): Promise<string> {
        const logResult = await this.git.log({ maxCount });
        return JSON.stringify(logResult, null, 2);
    }

    public async add(files: string | string[]): Promise<void> {
        await this.git.add(files);
    }

    public async commit(message: string): Promise<void> {
        await this.git.commit(message);
    }

    public async push(remote: string = 'origin', branch: string = 'main'): Promise<void> {
        await this.git.push(remote, branch);
    }

    public async pull(remote: string = 'origin', branch: string = 'main'): Promise<void> {
        await this.git.pull(remote, branch);
    }
}